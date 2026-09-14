# Rate Limiter Handoff

Written 2026-08-16. Picking up work started 2026-08-11.

Goal: generalize the forgot-password-only rate limiter into a shared service, and
close the account-lockout DoS it introduced.

**Guiding principle for every decision below:** never key a *blocking* limit on an
identifier the attacker chooses and the victim owns. Blocking limits go on the
attacker's resource (IP, device, session). Victim-owned identifiers get limits that
degrade or bound side effects, never ones that deny access.

Legend: `[ ]` open, `[x]` done, `[~]` in progress.

---

## State at handoff

Updated 2026-09-13. Items 1, 2, 3a, and 3b are all committed. Section 3 is now
closed and everything remaining is in Backlog.

Still not verified against a live server. The app imports and boots, and
`try_acquire_send_slot` was exercised against a stand-in Redis (claim, re-claim
refused, other address unaffected, 90s TTL attached, slot freed after expiry, bool
returned on `RedisError`). No real Redis and no real email has been through it -
Docker is not reachable from WSL on this machine, so that is the first thing to do
next session.

---

## 1. Count failures, not requests `[x]`

Login incremented the counter before verifying the password, so every attempt spent
budget regardless of outcome. An attacker could drive the counter to the limit and
the victim's *correct* password would then 429 - and never reach the
`clear_rate_limit` that was supposed to undo it.

Split the fused check into two service calls:

- `peek_rate_limit` - read-only, runs at the top of the handler. Enforces without
  counting, because the outcome is not yet known.
- `record_rate_limit_failure` - write-only, runs in the 401 branches. Counts
  without enforcing, because the response is already decided.

`check_rate_limit` stays as-is for signup and forgot-password, where arriving *is*
the offense and every request legitimately counts.

Both 401 branches in `login` record failures, **including user-not-found**. If that
branch does not record, an attacker probes unlimited addresses and learns which
exist from which requests eventually 429 - the limiter itself becomes the
enumeration oracle.

Accepted tradeoff: peek-then-increment is not atomic, so concurrent requests can
overshoot to roughly `limit + in-flight`. Fine for login throttling; the Lua-script
alternative is not worth the complexity yet.

Also in `peek_rate_limit`: `TTL` returning `-1` means a counter with no expiry, which
would block that key forever. The peek repairs it with `EXPIRE ... NX` and falls
through to the normal count comparison. It has to live in the peek - once the key is
blocking, the request 401s before the writer that would otherwise heal it runs.

## 2. Three-tier login keys `[x]`

`LOGIN_EMAIL` at 5/15min was the lockout vector: attacker-chosen key, victim-owned,
hard block. Failure-only counting did not help, because the attacker's attempts
genuinely are failures.

| scope | key | limit | catches |
|---|---|---|---|
| `LOGIN_IP` | ip | 20 / 15min | one host spraying many accounts |
| `LOGIN_EMAIL_IP` | `email\|ip` | 5 / 15min | one host grinding one account |
| `LOGIN_EMAIL` | email | 50 / 1hr | distributed attack on one account |

The strict 5 moved to the composite scope, so an attacker hammering a victim's email
burns their own bucket while the victim's home IP keeps a clean one.

`|` is a safe delimiter because a validated email cannot contain one.

`peek_rate_limits` / `record_rate_limit_failures` / `clear_rate_limits` take a
`checks` list of `(policy, key)` pairs so the tiers cannot drift apart.
`peek_rate_limits` evaluates **all** tiers rather than short-circuiting, and returns
`max()` of the retry values - `min()` would tell a user to come back in 15 minutes
when the 1-hour tier is also blocking them.

**On success, clear `email_checks` only. Never the IP counter.** Clearing an
email-scoped counter requires the correct password for that account, so an attacker
cannot reach the victim's. A success only proves you own *some* account, so clearing
the IP counter would let anyone with a throwaway signup grind indefinitely: fail 19
times, log into their own account, counter wiped, repeat.

Remaining gap: `LOGIN_EMAIL` at 50/hr still *prices* a distributed lockout rather
than eliminating it. See item 2 in Backlog.

## 3. Forgot-password `[x]`

Two independent problems. Neither is finished.

### 3a. Stop revoking tokens on send `[x]`

Every forgot-password request revoked all outstanding tokens before minting a new
one. An attacker polling the endpoint kept the victim's emailed link permanently
dead - the victim clicks and gets "Invalid or expired reset token" with no
explanation. That is a cleaner denial than the rate-limit lockout, and it works
*within* the limit.

**Fix: let tokens coexist.** Mint a fresh token per request and revoke nothing on
send. `reset_password.py` already revokes all other outstanding tokens on
redemption, which is now the only revocation in the system - that code is
load-bearing, do not remove it as redundant.

Retirement paths become: redemption (revokes all others), expiry, nothing else.

**Do not try to reuse the existing token.** An earlier attempt at this was written and
then deleted, because it cannot work: only the SHA-256 hash is stored, so the raw
secret can never be recovered from the row and the emailed link cannot be rebuilt.
If a future change makes "resend the same link" look attractive again, this is why
it is not.

`if user:` is now linear: mint, hash, insert, commit, build URL, queue email.

Unbounded live tokens is the obvious objection, but volume is capped by 3b: a
handful per user per window, each 32 bytes of entropy, each expiring independently.

Also: any single-row query over outstanding tokens must now tolerate multiples.
"At most one live token" used to be an invariant and no longer is. Use
`.order_by(...).limit(1)` with `.scalars().first()`, not `scalar_one_or_none()`,
which raises `MultipleResultsFound`.

### 3b. Replace the email block with a send cooldown `[x]`

`FORGOT_PASSWORD_EMAIL_LIMIT` is still a 3/hour hard block. That is the original
lockout, untouched: an attacker burns three requests and the victim's genuine reset
email never arrives, with `silent=True` making it invisible.

**Why the control is wrong here:** a forgot-password request delivers a capability to
the *victim's own inbox*. When the attacker submits your address, you receive a
working link - the thing you wanted. The attacker cannot deny access by making
requests, because every request serves the victim. Compare a failed login, which
gives the victim nothing. That asymmetry is why the same control is right in one
place and wrong in the other.

So the email-scoped rule is not protecting access. It bounds **outbound mail**, so
the endpoint cannot be used as a spam relay aimed at someone's inbox.

Fix:

- 60-120s send cooldown keyed on email, via `SET key value NX EX <seconds>`. Redis
  returns truthy only if the key did not exist, so the decision and the write are one
  atomic op - unlike the login peek/record split, where they are necessarily
  separate. Suggested shape: `try_acquire_send_slot(redis, policy, key) -> bool`.
- Loose hourly ceiling (~10) as a mail-volume backstop.
- Keep `FORGOT_PASSWORD_IP_LIMIT` exactly as-is. Keyed on the attacker, safe to block
  hard.

Check the cooldown **before any DB write**. With 3a done nothing is revoked on send
so the ordering trap mostly dissolves, but there is no reason to do work that gets
discarded.

Response body and status must stay byte-identical on every path, including the
suppressed one.

Suppression is free once 3a lands: the recipient's earlier link is still live, so
nothing is denied.

**As built:**

- New scope `FORGOT_PASSWORD_EMAIL_COOLDOWN` and policy `FORGOT_PASSWORD_SEND_COOLDOWN`,
  90s. Claimed by `try_acquire_send_slot()`, which is a single
  `SET key "1" NX EX <window>`. Returns a plain `bool`, not the `(allowed, retry_after)`
  tuple the other functions return, because nothing is ever told to the user here -
  the suppressed response is byte-identical to the sent one.
- `FORGOT_PASSWORD_EMAIL_LIMIT` retuned from a 3/hour block to a 10/hour mail ceiling.
  Still `check_rate_limit`, still `silent`.
- `FORGOT_PASSWORD_IP_LIMIT` untouched.
- On `RedisError` the slot function returns `policy.fail_open` (`False`), so a Redis
  outage suppresses sends. Note this is fail-closed for the *opposite* reason to the
  login limiter: there it protects accounts, here it protects outbound mail volume.

**Why one command instead of a pipeline.** `NX` makes the check and the write a single
atomic step, so unlike the login peek/record split there is no window for concurrent
requests to both decide they may send. This function genuinely has no overshoot
caveat - do not "fix" it to match the others.

**No `ttl == -1` repair needed here.** That guard exists in `peek_rate_limit` because
`INCR` creates the key and `EXPIRE` attaches the timer as separate commands, leaving a
crash window where a key has no countdown and blocks forever. `SET ... EX` creates the
key and its timer together, so the stuck state is unreachable by construction.

**Ordering is load-bearing: cooldown first, ceiling second.** `check_rate_limit`
increments on arrival, whether or not mail follows. Trace 360 requests/hour at one
address:

- cooldown first: ~1 per 90s reaches the counter, 10 mails go out, all to the victim,
  all with live links.
- ceiling first: all 360 hit the counter, it exhausts inside two minutes having sent
  only 1-2 mails, and the victim is refused for the remaining 58 minutes.

The second is the original lockout with a bigger number. Cooldown first means the
hourly counter only ever counts requests that actually sent.

Both checks run before the `select(User)` - no reason to do work that gets discarded.

**Known limitation, accepted.** TTL gives a fixed window, not a sliding one, so the
hourly ceiling can pass ~20 mails across an hour boundary. Acceptable because the
cooldown forces 90s spacing (reaching 10 takes 15 minutes of sustained effort) and
because the thing being bounded is mail volume, not access. A true sliding window
would need a sorted set of timestamps; not worth it here.

---

## Backlog

1. **Do not wire a signup-email limit.** (Re-read 2026-09-13: no such policy exists -
   only the unused enum member `RateLimitScope.SIGNUP_EMAIL`. Deleting that member is
   the whole cleanup.) The reasoning stands: An
   email at signup has no account behind it, so a blocking counter on it lets anyone
   permanently deny registration for any address they can guess. The attack is
   cheaper than the abuse it prevents. Per-IP plus eventual CAPTCHA and email
   verification are the right controls. Either delete it or leave this note next to
   it - it currently reads as half-finished.
2. **CAPTCHA escalation on the loose `LOGIN_EMAIL` tier.** Crossing it should degrade
   to a challenge (Turnstile is free and low-friction), not deny. That is what turns
   the priced lockout into a closed one. Cheaper interim option: a signed
   known-device cookie set on successful login that raises or bypasses the email
   tier.
3. **bcrypt blocks the event loop.** `verify_password` is synchronous and called
   directly inside `async def login`. It is deliberately slow and CPU-bound, so it
   stalls every concurrent request on that worker. `run_in_threadpool`, or make the
   service method async.
4. **Timing-based user enumeration.** The not-found branch returns immediately; the
   wrong-password branch pays bcrypt first. Tens of milliseconds, consistently
   measurable, and it is now the main enumeration channel since the limiter hides the
   429 pattern. Verify the submitted password against a fixed dummy hash in the
   not-found branch so both paths cost the same.
5. **No tests anywhere in `backend/`.** The service is pure enough to unit test with
   fakeredis: window rollover, fail-closed on `RedisError`, `Retry-After` values, the
   `ttl == -1` repair, clear-on-success touching email scopes but not IP.
6. **Cleanup.** Empty `backend/src/models/rate_limit.py` (committed by accident in
   `c489747`). The `silent` field is set on five policies and read nowhere - each
   caller hand-implements the behavior, so the field is decorative. Same for `limit`
   on `FORGOT_PASSWORD_SEND_COOLDOWN`: `try_acquire_send_slot` never reads it, it is
   only there because the dataclass requires it.
   Corrected on re-read 2026-09-13: the "unused `UUID` import in `auth.py:1`" noted
   here does not exist - `routers/auth.py` has no `UUID` at all, and the imports in
   `schemas/auth.py` and `services/auth_services.py` are both used.
7. **Deferred to deployment: `request.client.host` is the proxy IP.** Behind a
   reverse proxy every request collapses to one key and the IP tiers become a global
   lockout switch. Needs trusted `X-Forwarded-For` extraction plus uvicorn
   `--proxy-headers` / `ProxyHeadersMiddleware` with a trusted-hosts list. Cannot be
   configured correctly until the real proxy topology exists.

---

## Notes on the design

`fail_open` on `RateLimitPolicy` decides behavior when Redis itself is unreachable.
All policies are currently `False` (fail closed), so a Redis outage returns 429 to
every auth request. That is the right default - an attacker who can knock over Redis
should not get free rein - but it means a single unreplicated container is a hard
auth dependency. Note `main.py` also pings Redis during lifespan and only assigns
`app.state.redis` on success, so `fail_open` only covers Redis dying *after* startup.

Redis runs with `--save "" --appendonly no`, so a restart wipes all counters. That is
intentional for rate limiting, but a container bounce resets every lockout.

`transaction=True` on the `GET`/`TTL` pair in `peek_rate_limit` is load-bearing, not
decoration: `MULTI`/`EXEC` makes both commands observe the same snapshot, which is
why a missing key always pairs `count = 0` with `ttl = -2` and the `-2` case needs no
explicit handling. Do not relax it to a plain pipeline.
