import hashlib
import logging

from redis.asyncio import Redis
from redis.exceptions import RedisError

from dataclasses import dataclass
from datetime import timedelta
from enum import StrEnum


logger = logging.getLogger(__name__)


class RateLimitScope(StrEnum):
    FORGOT_PASSWORD_IP = "forgot_password_ip"
    FORGOT_PASSWORD_EMAIL = "forgot_password_email"
    LOGIN_EMAIL = "login_email"
    LOGIN_IP = "login_ip"
    SIGNUP_IP = "signup_ip"


@dataclass(frozen=True)
class RateLimitPolicy:
    scope: RateLimitScope
    limit: int
    window: timedelta
    silent: bool = False
    fail_open: bool = False

    def __post_init__(self):
        if self.limit < 1:
            raise ValueError("Rate limit must be at least 1")

        if self.window <= timedelta(0):
            raise ValueError("Rate limit window must be positive")


FORGOT_PASSWORD_EMAIL_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.FORGOT_PASSWORD_EMAIL,
    limit=3,
    window=timedelta(hours=1),
    silent=True,
    fail_open=False,
)


FORGOT_PASSWORD_IP_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.FORGOT_PASSWORD_IP,
    limit=10,
    window=timedelta(hours=1),
    silent=True,
    fail_open=False,
)


LOGIN_EMAIL_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.LOGIN_EMAIL,
    limit=5,
    window=timedelta(minutes=15),
    silent=False,
    fail_open=False
)


LOGIN_IP_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.LOGIN_IP,
    limit=20,
    window=timedelta(minutes=15),
    silent=False,
    fail_open=False
)


SIGNUP_IP_LIMIT = RateLimitPolicy(
    scope=RateLimitScope.SIGNUP_IP,
    limit=3,
    window=timedelta(hours=1),
    silent=False,
    fail_open=False
)


def _build_redis_key(policy: RateLimitPolicy, key: str) -> str:
    digest = hashlib.sha256(f"{policy.scope}:{key}".encode()).hexdigest

    return f"rl:{policy.scope}:{digest}"


async def check_rate_limit(redis: Redis, policy: RateLimitPolicy, key: str) -> tuple[bool, int | None]:
    window_sec = int(policy.window.total_seconds())
    redis_key = _build_redis_key(policy, key)

    try:
        async with redis.pipeline(transaction=True) as pipe:
            pipe.incr(redis_key)
            pipe.expire(redis_key, window_sec, nx=True)
            pipe.ttl(redis_key)
            count, _, ttl = await pipe.execute()

        allowed = count <= policy.limit

        return allowed, None if allowed else max(1, ttl)

    except RedisError:
        logger.exception(
            "Redis rate-limit check failed for scope=%s",
            policy.scope,
        )

        return policy.fail_open, None


async def clear_rate_limit(redis: Redis, policy: RateLimitPolicy, key: str):
    redis_key = _build_redis_key(policy, key)

    try:
        await redis.delete(redis_key)

    except RedisError:
        logger.exception(
            "Failed to clear rate-limit counter for scope=%s",
            policy.scope
        )
