# Recorder Reference (offline-friendly)

Written so the recorder work can continue with no internet and no camera on the
LAN. Everything here was verified against this machine on 2026-09-15 unless a
line says otherwise.

Contents:

1. [What is running locally](#1-what-is-running-locally)
2. [Working with no camera](#2-working-with-no-camera)
3. [ffmpeg: the command that works](#3-ffmpeg-the-command-that-works)
4. [ffmpeg option reference](#4-ffmpeg-option-reference)
5. [Checking that a file is valid](#5-checking-that-a-file-is-valid)
6. [Running ffmpeg from Python](#6-running-ffmpeg-from-python)
7. [uv reference](#7-uv-reference)
8. [Project layout rules learned the hard way](#8-project-layout-rules-learned-the-hard-way)
9. [pydantic-settings gotchas](#9-pydantic-settings-gotchas)
10. [Storage math](#10-storage-math)
11. [Decisions still open](#11-decisions-still-open)
12. [Errors seen so far and their fixes](#12-errors-seen-so-far-and-their-fixes)

---

## 1. What is running locally

All of these are containers on this machine. None of them need the internet.

| Service | Host port | Notes |
|---|---|---|
| go2rtc web UI / API | 1984 | `http://127.0.0.1:1984`, API at `/api/streams` |
| go2rtc RTSP restream | 8654 | container port is 8554, compose maps 8654 |
| go2rtc WebRTC | 8555 | `candidates:` in go2rtc.yaml must hold the host LAN IP |
| Postgres | 5433 | |
| Redis | 6379 | bound to 127.0.0.1, no persistence |
| Mailpit | 8025 UI, 1025 SMTP | `dev` profile only |

Use `127.0.0.1`, never `localhost`, in any `.env`. On Windows `localhost` can
resolve to IPv6 `::1` while the container publishes on IPv4 only, and the
failure looks like a hang rather than an error.

Check what go2rtc actually has registered:

```
curl http://127.0.0.1:1984/api/streams
```

This is the authority, not `go2rtc.yaml`. The backend writes streams into
go2rtc at runtime, so the file and the live set can differ. Current stream
names are `test1_70c2_main` and `test1_70c2_sub`.

The recorder pulls from the restream, not from the camera:

```
rtsp://127.0.0.1:8654/test1_70c2_main
```

Going through go2rtc matters. Cameras allow a small number of simultaneous
RTSP connections (often two or four). go2rtc opens one connection to the camera
and fans it out, so the recorder, the browser preview and anything else added
later all share a single camera session.

### Stream properties measured on this camera

```
Video: h264 (High), yuv420p, 2560x1920, 25 fps
Audio: aac (LC), 16000 Hz, mono
```

Roughly 5 Mbps measured from real file sizes. See [storage math](#10-storage-math).

---

## 2. Working with no camera

On a plane the camera at `192.168.1.50` is unreachable, so go2rtc has no
producer. Replace it with a local file.

go2rtc's ffmpeg source syntax, from its `internal/ffmpeg/README.md`:

```
"ffmpeg:{input}#{param1}#{param2}#{param3}"
```

with a file example of `ffmpeg:/media/BigBuckBunny.mp4`, and `#input=` to
override the default input arguments, for example
`#input=-timeout {timeout} -i {input}`.

So a file-backed stream that repeats forever is shaped like:

```yaml
streams:
  fake_main: "ffmpeg:/media/clip.mp4#input=-re -stream_loop -1 -i {input}"
```

- `-stream_loop -1` repeats the input forever. It must appear **before** `-i`.
- `-re` reads at the native frame rate. Without it ffmpeg pushes the file
  through at disk speed and the "camera" runs at many times real time.

The file has to be visible inside the go2rtc container, so it needs a volume
mount in `docker-compose.yaml` pointing at wherever the clip lives.

Looping is not stated in go2rtc's own docs, it follows from the `#input=`
override, so confirm it works while the real camera is still available for
comparison.

A file-backed stream is in some ways better than a real camera for step 2: it
can be stopped and restarted on demand, which is how the restart and backoff
path gets tested. That is awkward with a camera that has to be physically
unplugged.

### Before going offline

- `uv sync` in `backend/`, `worker/` and `visionx_db/`. Any `uv add` needs PyPI.
- `docker compose pull` so no image is missing.
- Confirm `docker compose up` starts clean with the file-backed stream.
- Keep the sample recordings in `storage/recordings/`, they are the loop source.

---

## 3. ffmpeg: the command that works

```
ffmpeg -rtsp_transport tcp -i "rtsp://127.0.0.1:8654/test1_70c2_main" \
  -c copy \
  -f segment \
  -segment_time 600 \
  -segment_format mp4 \
  -segment_format_options movflags=+hybrid_fragmented \
  -reset_timestamps 1 \
  -strftime 1 \
  "C:\path\to\storage\recordings\cam1_%Y%m%d-%H%M%S.mp4"
```

Things that are easy to get wrong:

- **The last argument is a filename pattern, not a directory.** Passing a
  folder gives `Output file does not contain any stream` followed by
  `Error opening output file`.
- **`-rtsp_transport tcp` goes before `-i`.** Options placed before `-i` apply
  to the input, options after it apply to the output. Put it in the wrong place
  and it silently applies to nothing.
- **`movflags` is an MP4/MOV option.** Combining it with
  `-segment_format mkv` gives `Some of the provided format options are not
  recognized` and then `Could not write header`. Either mp4 with movflags, or
  mkv without it. There is no third combination.
- **`.mp4` extension on the output pattern.** ffmpeg uses it to choose the
  muxer for each piece.

### Why MP4 and not MKV

MKV tolerates truncation well on its own, so on crash safety alone it would be
a reasonable choice. The deciding factor is playback: `<video>` plays MP4 in
every browser and MKV in none. Recording MKV means remuxing at view time
forever. Record MP4.

MP4 is stricter about audio codecs. It accepts AAC, which this camera sends. A
camera sending G.711 or PCM would be rejected, and the fix there is `-an` to
drop audio, not a container change.

### Filename layout

`-strftime 1` formats in **local time**. Crossing timezones makes filenames
appear to move backwards. Prefer UTC in filenames and database timestamps and
convert to local only for display.

A flat directory will hold thousands of files. A layout like
`<camera>/<date>/` keeps listings small and makes the retention deleter
obvious. Decide before writing rows, because changing it later means migrating
database rows alongside the files.

---

## 4. ffmpeg option reference

### Input options (before `-i`)

| Option | Meaning |
|---|---|
| `-rtsp_transport tcp` | RTSP over TCP. UDP drops packets and produces corrupt frames. |
| `-re` | Read input at native frame rate. For file sources only, never for a live camera. |
| `-stream_loop -1` | Repeat the input forever. File sources only. |
| `-nostdin` | Do not read stdin. **Do not use this** if stopping ffmpeg by writing `q` to stdin. |

### Output options

| Option | Meaning |
|---|---|
| `-c copy` | Remux without re-encoding. Near zero CPU. If ffmpeg is using a full core, this flag was lost. |
| `-an` | Drop audio. |
| `-f segment` | Use the segment muxer. |

### Segment muxer options

Quoted from the FFmpeg Formats Documentation:

| Option | Description |
|---|---|
| `segment_time` | Segment duration in seconds. Fractional values are permitted. |
| `segment_format` | Container format for segment files (mp4, webm, mpegts). |
| `segment_format_options` | Format options as a **colon-separated** list of `key=value` pairs. |
| `segment_list` | Generate a segment list file referencing all segments. |
| `segment_list_type` | List format: `csv`, `json`, `m3u8`, `vtt`. |
| `segment_atclocktime` | Start segments at round clock times rather than fixed intervals. |
| `reset_timestamps` | Reset timestamps at segment start, so each file begins at zero. |
| `strftime` | Use strftime formatting in segment filenames. |
| `segment_wrap` | Wrap segment numbers after a maximum value. |
| `segment_start_number` | Initial segment number. |
| `break_non_keyframes` | Allow breaking segments at non-keyframes. |
| `segment_time_delta` | Timestamp tolerance for segment boundary detection, in seconds. |

`segment_atclocktime 1` is worth considering later. It aligns cuts to round
clock times, so a 10 minute setting produces files starting at :00, :10, :20.
That makes "find the file covering 14:37" arithmetic instead of a search.

**Segments cut only on keyframes.** `-segment_time 600` means "close at the
first keyframe at or after 600 seconds". With a 4 second keyframe interval that
gives 600 to 604 second files. With a 60 second interval the files are wildly
uneven. Never assume exact durations. If files come out uneven, fix the
camera's keyframe interval rather than the ffmpeg command. `break_non_keyframes`
exists but forces re-encode-like behaviour on playback boundaries and is not
worth it.

### movflags

Quoted from the FFmpeg Formats Documentation:

| Flag | Description |
|---|---|
| `hybrid_fragmented` | "For recoverability - write the output file as a fragmented file. This allows the intermediate file to be read while being written..." |
| `frag_keyframe` | "start a new fragment at each video keyframe" |
| `faststart` | "Run a second pass moving the index (moov atom) to the beginning of the file." |
| `delay_moov` | "delay writing the initial moov until the first fragment is cut, or until the first fragment flush" |
| `default_base_moof` | Avoids writing the absolute `base_data_offset` field in tfhd atoms, using the default-base-is-moof flag instead. |

Related options: `frag_duration` ("Create fragments that are duration
microseconds long") and `min_frag_duration` ("do not create fragments that are
shorter than duration microseconds long").

`faststart` is not useful here. It needs a second pass over a finished file, so
it cannot help a process that gets killed. `hybrid_fragmented` is the flag that
survives a crash.

Note the colon separator when passing more than one:

```
-segment_format_options movflags=+hybrid_fragmented:another_opt=value
```

---

## 5. Checking that a file is valid

MP4 is a tree of boxes. Each box is a 4 byte big-endian size followed by a 4
byte type. Walking the top level tells you whether a file is finalized without
needing a player.

### Clean exit

```
ftyp / free / mdat / moov
```

`moov` is the index, and it sits **last**, ending exactly at end of file. This
is an ordinary MP4. Measured example: `moov` at offset 40246973, size 30323, in
a 40277296 byte file.

### Hard kill

```
ftyp / free / free / moov / mdat / moof / mdat / moof / mdat ...
```

`moov` sits at the **front** (measured: offset 88, size 2723). It is the
initialization header, written before any media. Each `moof` that follows
indexes the `mdat` behind it, so a player walks forward and decodes every
complete fragment. The final `mdat` extends past end of file, which is normal,
and a player stops at the last complete pair.

Measured worst case data loss: fragments are about 1.27 MB, which at 5 Mbps is
under two seconds. Without `hybrid_fragmented` the whole in-progress segment is
lost, up to the full `segment_time`.

### Ctrl-C is not a crash

ffmpeg catches SIGINT and shuts down gracefully: it flushes, writes the index,
and converts the fragmented file into a regular one. Pressing Ctrl-C tests the
clean path only. To test the recovery path, kill without a signal:

```powershell
Stop-Process -Name ffmpeg -Force
```

`-Force` maps to `TerminateProcess`, the same hard kill as `taskkill /F`. There
is no handler, no flush, no index write. To do it by PID:

```powershell
Get-Process ffmpeg          # read the Id column
taskkill /F /PID <id>
```

For a faster test loop, drop `-segment_time` to 30 so a boundary is crossed in
under a minute.

### Tools

`ffprobe -v error -show_entries format=duration,size -of default=nw=1 <file>`
gives duration and size. It ships with ffmpeg on Windows but is not installed
in this WSL environment, so the box walk above is the fallback that always
works.

---

## 6. Running ffmpeg from Python

This is process control, not video, which is why it can be built against a
looping file with no camera present.

### Building the command

Pass `subprocess.Popen` a **list of strings**, never a single string, and never
`shell=True`. With a list, arguments go to the process untouched, so spaces in
paths like `COM SCI` stop mattering and quoting disappears as a concern. If the
code is doing string formatting with quote characters in it, something has gone
wrong.

The URL and the output pattern come from config. Everything else is constant.

Create the output directory at startup. `.gitignore` has `storage/*`, so a
fresh clone has no `recordings/`, `snapshots/` or `thumbnails/` directory at
all, and ffmpeg will not create one.

### Stopping cleanly

Two exit paths, in order:

1. **Graceful.** Write `q` and a newline to ffmpeg's stdin, then `wait()` with
   a timeout. ffmpeg reads stdin for keyboard commands and `q` means stop and
   finalize, producing the clean `moov`-at-end file. This requires opening the
   process with `stdin=subprocess.PIPE`. If stdin is closed or pointed at
   devnull, or `-nostdin` is passed, ffmpeg has nothing to read and the trick
   does nothing at all, silently.
2. **Fallback.** If `wait()` times out, `kill()`. This path is already proven
   to leave a playable file, so it is a safety net rather than a disaster.

Do not reach for signals. `SIGINT` to another process does not exist
meaningfully on Windows, and the workaround (`CREATE_NEW_PROCESS_GROUP` plus
`CTRL_BREAK_EVENT`) is fiddly and platform-specific. The `q`-on-stdin path
behaves the same on Windows and Linux, which matters once this runs in a
container.

### Restarting

ffmpeg exits on its own when the camera reboots, the network blips, or go2rtc
restarts. The supervisor watches for the process ending and starts a new one.

The trap is the tight restart loop. With the camera unplugged ffmpeg fails in
well under a second, and a naive `while True` restart spins thousands of times a
minute, filling the disk with zero-byte files and the log with noise.

- Exponential backoff, capped. Start near one second, double each consecutive
  failure, cap around a minute.
- **Reset the counter after a run that lasted a while.** Otherwise a process
  that stayed up six hours and then died is punished with the full cap for no
  reason.
- Capture stderr rather than letting it reach the console. When a camera stops
  working the reason is in there.

### Files that are not recordings

A failed run leaves a zero-byte file behind: ffmpeg opens the output, then dies
writing the header. One of these is already sitting in the test output. When
directory scanning starts writing database rows, "file exists" is not the same
as "valid recording". Skip zero-byte files, and ideally check duration before
inserting a row.

---

## 7. uv reference

| Command | Effect |
|---|---|
| `uv init` | Create a new project. Flat layout by default here. |
| `uv init --lib` | Create a library with a `src/` layout. |
| `uv sync` | Install everything in the lockfile. Needs the network unless the cache is warm. |
| `uv add <pkg>` | Add a dependency, update `pyproject.toml` and `uv.lock`, and install. |
| `uv add --editable ../visionx_db` | Add a local path dependency in editable mode. |
| `uv run <cmd>` | Run a command inside the project environment. Removes any doubt about which interpreter is used. |
| `uv lock` | Refresh the lockfile without installing. |

**Hand-editing `pyproject.toml` installs nothing.** It was edited by hand once
during the package extraction; `grep -c visionx backend/uv.lock` returned 0 and
site-packages was empty. Running `uv add --editable ../visionx_db` wrote the
dependency, the `[tool.uv.sources]` entry, the lockfile and the install
together.

`uv add --editable` produces:

```toml
dependencies = ["visionx-db"]

[tool.uv.sources]
visionx-db = { path = "../visionx_db", editable = true }
```

uv is at `C:\Users\PTruo\.local\bin\uv.exe`.

### Which interpreter

`backend/` has both `.venv` and `venv`, and `uv add` only installed into
`.venv`. A bare `uvicorn main:app` picks whichever comes first on PATH, which
is how a stale `ModuleNotFoundError: No module named 'visionx_db'` appeared
after the package was already installed correctly. Launch explicitly:

```
.venv\Scripts\python.exe -m uvicorn main:app --reload
```

or `uv run uvicorn main:app --reload`. `worker/` currently uses `venv` rather
than `.venv`, which is worth normalizing.

---

## 8. Project layout rules learned the hard way

### Import path is not filesystem path

An installed package is found by its **top-level module name**. The outer
project directory is read by the build backend and then discarded. With the
package living at `visionx_db/visionx_db/database.py`, the import is:

```python
from visionx_db.database import Base      # correct
from visionx_db.visionx_db.database import Base   # wrong, and was written twice
```

This was fixed with `sed -i 's/visionx_db\.visionx_db/visionx_db/g'` across 22
call sites.

### src layout vs flat layout

`uv_build` defaults to `module-root = "src"`. Setting it empty gives a flat
layout:

```toml
[tool.uv.build-backend]
module-root = ""
```

src layout prevents importing from the source tree by accident. Flat layout is
one level shallower and is what Flask and Requests use. This project chose flat.

### Distribution name vs import name

`visionx-db` with a dash is the distribution name from `name` in
`pyproject.toml`. `visionx_db` with an underscore is the module that gets
imported. PEP 503 normalization makes the two equivalent in dependency lists,
so the mismatch is expected rather than a mistake.

### TOML dependencies are strings

```toml
dependencies = [SQLAlchemy, asyncpg]              # invalid, bare identifiers
dependencies = ["sqlalchemy>=2.0.51", "asyncpg>=0.31.0"]   # correct
```

The first form fails with `tomllib.TOMLDecodeError: Invalid value`.

### What the shared package owns

`visionx_db` holds `Base`, the engine, `SessionLocal`, `get_db`, and the seven
models. It depends on exactly three things: SQLAlchemy, asyncpg and
pydantic-settings. That short list is the constraint that makes it usable from
the worker. Adding anything backend-specific to it defeats the extraction.

Alembic deliberately stays in `backend/`.

`visionx_db/visionx_db/models/__init__.py` eagerly imports all seven models and
lists them in `__all__`. Alembic autogenerate depends on this: a model that is
never imported is invisible to it, and autogenerate will cheerfully write a
migration that drops the table.

---

## 9. pydantic-settings gotchas

These cost real time during the extraction.

**Settings classes do not write into `os.environ`.** A class loading `.env`
puts values on the model instance and nowhere else. A second settings class
cannot piggyback on the first. Each one finds its own values independently.

**Unknown keys are rejected by default.** Two settings classes sharing one
`.env` file each need `extra="ignore"`, or they raise `extra_forbidden` on the
other class's variables. The package's settings rejected `JWT_SECRET_KEY` and
`SMTP_*`; then the backend's settings rejected `DATABASE_URL`. Both needed the
flag.

**`env_file=".env"` resolves against the working directory**, not the module
location. So the worker has to be started from `worker/`, or given an absolute
path. Per-app `.env` files, real environment variables in Docker, and Docker's
env vars take precedence over file values.

**Do not hardcode what should be configuration.** `echo=True` became a
module-level `ECHO` constant at one point, which is still compiled into the
package. It is now the `DB_ECHO` setting, defaulting to `False`.

### WSL to Windows environment variables

A plain assignment does not reach a Windows `.exe` launched from WSL. Both
`env -i` and inline assignment produced empty settings. `WSLENV` is the
mechanism:

```
WSLENV='DATABASE_URL' DATABASE_URL='...' /path/to/python.exe script.py
```

---

## 10. Storage math

Measured, not estimated: 54 MB in about 85 seconds, which is roughly **5 Mbps**
on the main stream. That is consistent with 2560x1920 at 25 fps.

| Scenario | Per camera per day | Per camera over 6 months |
|---|---|---|
| Main stream, continuous | ~55 GB | ~10 TB |
| Main stream, 25% duty | ~14 GB | ~2.5 TB |
| Main stream, 10% duty | ~5.5 GB | ~1 TB |
| Substream, continuous | ~14 GB | ~2.5 TB |

The substream is roughly a quarter the size.

Retention has two rules. The **6 month age rule** is the primary one. The
**free space floor** is a backstop for when something unexpected fills the
disk. At low duty cycle the age rule fires first; at continuous recording on
the main stream the space rule would fire constantly, which is a sign the
recording model is wrong rather than the retention model.

Write the deleter so that "which recordings are eligible for deletion" is a
single query or function. The protect flag is deferred, and when it arrives it
should be one extra clause in one place.

---

## 11. Decisions still open

**Continuous or triggered recording.** This blocks the supervisor design and
the retention design. At 5 Mbps, continuous main-stream recording is about
55 GB per camera per day. The common shape is: record the substream
continuously, since it is cheap and good enough to see that something happened,
and record the main stream only around events. That means two recorders per
camera and a merge problem at playback. Step 2's process control code does not
care either way; step 3 and step 4 care a great deal.

**Directory layout for recordings.** Flat, or `<camera>/<date>/`. Decide before
writing database rows.

**UTC or local time** in filenames and timestamps. UTC is the safer default.

**MKV remux endpoint.** Only relevant if MKV comes back. Currently MP4, so no.

### Remaining steps

- **Step 2**: Python wrapper. One camera, hardcoded, clean start and stop, restart with backoff. No database.
- **Step 3**: supervisor reads cameras from the database; rows written by scanning the output directory.
- **Step 4**: retention. Age rule first, free space floor second, protect flag later.
- **Step 5**: API and UI for playback.

### Backlog carried from elsewhere

- Move Alembic beside the models (deferred).
- Add the protect / `retain_until` column (deferred).
- Swap the OpenCV camera health probe for a go2rtc `/api/streams` probe.
- `backend/` has zero tests. Good offline work, needs no camera.
- Rate limiter: proxy `X-Forwarded-For` handling, bcrypt blocking the event
  loop, timing-based user enumeration, CAPTCHA escalation on `LOGIN_EMAIL`,
  removal of the decorative `silent` field and the unused
  `RateLimitScope.SIGNUP_EMAIL`.
- The forgot-password cooldown is committed but has never been run against real
  Redis or real email. Redis is reachable now, so it is testable.
- `backend/.env.example` uses `localhost` in `GO2RTC_PUBLIC_URL`,
  `CORS_ALLOWED`, `FRONTEND_URL`, `SMTP_HOST` and `REDIS_URL`, which
  contradicts the `127.0.0.1` rule.
- `worker/` has two `main.py` files, one at `worker/main.py` from `uv init` and
  an older empty one at `worker/src/main.py`. Pick one.
- `worker/pyproject.toml` still says `description = "Add your description here"`
  and `worker/README.md` is empty.
- `.gitignore` has no trailing newline.

---

## 12. Errors seen so far and their fixes

| Message | Cause | Fix |
|---|---|---|
| `Output file does not contain any stream` then `Error opening output file` | Output argument was a directory, not a filename pattern | Give a full path ending in `name_%Y%m%d-%H%M%S.mp4` |
| `Some of the provided format options are not recognized` then `Could not write header (incorrect codec parameters ?)` | `movflags` passed to the Matroska muxer | Use mp4 with movflags, or mkv without |
| `ModuleNotFoundError: No module named 'visionx_db'` | Server started before `uv add` ran, or launched from the wrong venv | Restart, and launch via `uv run` or the explicit `.venv` python |
| `tomllib.TOMLDecodeError: Invalid value` | Bare identifiers in `dependencies` | Quoted PEP 508 strings |
| pydantic `extra_forbidden` | Two settings classes sharing one `.env` | `extra="ignore"` on both `model_config` blocks |
| Settings load with `input_value={}` under WSL | Environment variables not forwarded to the Windows `.exe` | Set `WSLENV` |
| Last recorded file will not play | Plain MP4 writes its index at the end | `movflags=+hybrid_fragmented` |
