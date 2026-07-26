# ADR 0001: AI Detection Pipeline Architecture

- **Status:** Accepted
- **Date:** 2026-07-26
- **Deciders:** Phuc Truong
- **Supersedes:** none
- **Affects:** `worker/`, `backend/src/models/event.py`, `backend/src/models/camera.py`, `docker-compose.yaml`

## Context

VisionX has streaming (go2rtc), camera CRUD, auth, health checks, and a schema that
already anticipates detections (`Event`, `Snapshot`, `Recording.has_person`). It has no
detection pipeline at all: `worker/src/main.py` is an empty file.

Before writing that worker, we researched how UniFi Protect, the closest commercial
system to VisionX in scope, structures its AI. The goal was to borrow proven structure
rather than invent a pipeline and discover its cost profile in production.

## Research findings: how UniFi Protect's AI works

UniFi runs a three-tier pipeline. The tiering is the important part, not the individual
features.

### Tier 1 - on-camera detection

G6 / AI-series cameras run person, vehicle, face, LPR, line-crossing, and audio
classification on the camera's own SoC. G4/G5 run only person and vehicle on-camera.
Ubiquiti's own wording: cameras "are only able to recognize very basic objects such as
people and vehicles." The NVR never processes a frame it does not need to.

### Tier 2 - AI Port ($199), real-time bridge

For G3 and third-party ONVIF cameras with no on-board AI, the AI Port ingests RTSP and
adds smart detections in real time. Capacity is bounded by pixel throughput:

| Camera type | Capacity per AI Port |
| --- | --- |
| ONVIF 4K | 1 camera |
| ONVIF 2K | 2 cameras |
| ONVIF HD | 3 cameras |
| Protect 4K | 2 cameras |
| Protect HD | 5 cameras |

It also auto-detects the camera's highest and lowest resolution streams and maps them to
HQ/LQ inside Protect. That is the same dual-stream idea VisionX already encodes as
`rtsp_main_url` / `rtsp_sub_url`.

### Tier 3 - AI Key ($799), asynchronous enrichment

The most transferable tier. The AI Key does **not** watch video streams. It "works as an
edge appliance by receiving smart detections from paired UniFi cameras" and runs those
detections "through a series of advanced AI models." It is a queue consumer:

- Internal queue limit: **200 events**, excess is discarded
- Throughput: **1,000 detections/hour** (help center) or **1,800/hour** (tech specs and
  store page). Ubiquiti's own documentation contradicts itself here; treat as approximate.
- A full queue delays results by **up to 15 minutes**
- Pairs with unlimited cameras; the hourly cap is the real constraint

Outputs: clothing type and color, gender, accessories, face enhancement, speech-to-text,
natural-language search, image-to-image search, and LLM event summaries ("NeXT AI
Summary"). Enabling automatic summaries explicitly reduces events/hour, which identifies
the summary model as the expensive stage.

Hardware: Arm Cortex-A78AE, 16 GB LPDDR5, 256 GB SSD, 45 W PoE++. That is an NVIDIA
Jetson Orin module. Ubiquiti bought the silicon and wrote the orchestration.

### Protect 7.0 (March 2026)

Added detection clustering: unique detections are grouped within a continuous motion
session so one person walking past produces one alert, not forty. Motion vectors are
rendered into event thumbnails.

## Decisions

### D1. Adopt the hot-path / enrichment split

Split the pipeline into a latency-critical hot path and an asynchronous enrichment stage,
mirroring the camera/AI-Key division without the hardware.

```
RTSP substream ──> [motion gate: frame diff + zones + cooldown]
                          │ (~1-5% of frames pass)
                          ▼
                   [object detector: YOLO on ONNX Runtime]
                          │
                          ▼
                   [tracker: assign track_id, cluster into sessions]
                          │
                   ┌──────┴──────────────┐
                   ▼                     ▼
          Event row (hot path)    enrichment queue
          confidence, label       (bounded, sheds load)
          snapshot_path                  │
          + track_id in metadata         ▼
                                  CLIP embedding -> pgvector
                                  attributes (color, type)
                                  optional VLM caption
                                         │
                                         ▼
                                  UPDATE event.description
                                  UPDATE event.metadata
```

Alert latency depends only on the hot path. Enrichment is allowed to be seconds or
minutes late, and is allowed to fail.

**Rationale:** it is the only structure that lets semantic features be added later without
regressing alert latency. Nothing in the hot path waits on a large model.

### D2. Motion gating in our own code, not camera ONVIF events

**Decided: implement the motion gate ourselves in `worker/`, reading `rtsp_sub_url`.**

We will not consume ONVIF motion events from cameras.

**Rationale:**

1. ONVIF motion eventing is standardized on paper only. Vendors use different topic names
   (`RuleEngine/CellMotionDetector/Motion`, `VideoSource/MotionAlarm`, private topics),
   some support only pull-point subscription, some only push. Supporting it means a
   per-vendor adapter set and a `motion_source` quirks column on `Camera`, forever.
2. It contradicts the product goal. VisionX's value is working with any RTSP camera. Making
   the core detection trigger vendor-dependent puts a per-model compatibility matrix at the
   center of the system.
3. Camera motion detection is tuned for alerting a human: conservative, debounced, and it
   hides frames from us. We need the opposite (see D3).

**Accepted cost:** we pay continuous substream decode per camera. Mitigated by sampling the
gate at ~5 fps rather than full frame rate.

### D3. The motion gate is a cost filter, not a feature

The gate's output is never shown to a user. Its only job is answering "is this frame boring
enough to skip YOLO?"

This inverts normal tuning:

- **High recall, low precision is correct.** A false positive costs one wasted inference
  (~10 ms). A false negative means a missed intruder.
- The gate is allowed to be dumb. Leaves, shadows, and headlight glare will trip it. YOLO
  rejects them and no `Event` row is written.
- If gate precision is *high*, the gate is too strict and is probably dropping real events.

Implementation shape:

| Step | Choice | Why |
| --- | --- | --- |
| Sample rate | ~5 fps regardless of stream fps | Nothing meaningful happens in 200 ms; cuts decode ~5x |
| Resolution | downscale to ~320x180, grayscale, light blur | Gate needs no detail; arrays become ~57 KB |
| Comparison | running background model (MOG2 or EMA), **not** adjacent-frame diff | Adjacent-frame diffing misses slow movers walking toward the camera |
| Blob filter | threshold, dilate, `findContours`, drop small areas | Kills sensor noise and distant foliage |
| Zones | per-camera polygon mask, applied before counting contours | Highest-value tuning knob, costs one bitwise-AND |
| Debounce | hold gate open a few seconds after a trip | Prevents flapping, gives the tracker a continuous run |
| Handoff | crop bounding box, map coords onto main-stream frame | Detector sees a small crop, not a 4K image |

Known behaviours, not bugs:

- Pass rate spikes after dark (IR mode, insects near IR illuminators). Bucket the pass-rate
  metric by hour so this is visible rather than alarming.
- Day/night mode switches change every pixel and open the gate fully until the background
  model recovers, typically a few seconds.

Deferred: extracting H.264 motion vectors from the bitstream to gate without full decode.
This is roughly what Protect 7.0 surfaces as motion paths. Revisit only if measurement
shows decode is the bottleneck.

### D4. Substream for inference, main stream for recording

`rtsp_sub_url` feeds the gate. `rtsp_main_url` feeds recording and supplies the high-res
crop for the detector. Resolution ratio is detected at connection time, not hardcoded,
because it varies per camera.

Both columns already exist on `Camera`. This decision is what they are for.

### D5. Bounded enrichment queue with explicit load shedding

The enrichment queue has a hard size limit and drops events on overflow, recording the drop
as a metric. This copies AI Key's 200-event behaviour deliberately: a documented,
observable failure mode beats an unbounded queue that degrades silently and then OOMs.

Queue transport: Redis, or Postgres `SELECT ... FOR UPDATE SKIP LOCKED`. Celery is rejected
as too heavy for this job shape.

**We do not copy the 1,000/hour throughput cap.** That is product segmentation on
Ubiquiti's part, not an engineering limit. Our cap is whatever the hardware sustains.

### D6. Session clustering, one event per presence

Adopt Protect 7.0's clustering. A `track_id` plus a session window means one `Event` per
continuous presence rather than one per frame. This is the difference between a usable
timeline and noise.

### D7. Semantic search via open CLIP embeddings

Use JinaCLIP v1 embeddings on the event thumbnail, stored in the database, giving
text-to-image and image-to-image search. This is the open equivalent of UniFi's "NeXT AI
natural language search" and image search.

**Constraint carried over from Frigate's documented experience:** do not build alerting on
text-to-image thresholds. CLIP cosine distances drift over time for the same text/image
pair, and distance distributions are dataset-dependent and too tightly clustered to pick a
stable cutoff. Search is exploratory and tolerant of error; automation is not. If we build
embedding-based triggers, use image-to-image against 3-5 curated reference thumbnails.

### D8. Model strategy: pretrained first, fine-tune on our own reviewed data

No training from scratch.

1. Ship with a pretrained COCO YOLO model. Person, car, dog, and package are all COCO classes.
2. Log every detection with its snapshot. `Snapshot` is already wired to `Event`.
3. Build a review UI to confirm or reject detections.
4. Fine-tune on confirmed data. Frigate+ reports roughly **80% true positives / 20% false
   positives** as the right training mix, and only counts verified labels. Their users
   report that fine-tuning without enough negatives makes false positives *worse*.
5. Keep a frozen held-out eval set. Report precision and recall per class per camera before
   promoting any model.

Step 5 is the differentiator. UniFi's models are closed and cannot be inspected, retrained,
or evaluated.

## Schema implications

Existing columns, and what they are now committed to holding:

- `Event.event_metadata` (JSONB): `track_id`, bounding box, zone name, **detector model
  version**. Model version is required so events can be attributed to the model that
  produced them during evaluation.
- `Event.confidence`, `Event.label`: written by the hot path.
- `Event.description`: written by the enrichment stage, nullable until then.
- `Recording.has_motion` / `has_person`: denormalized rollups set by enrichment, not
  computed on the hot path.
- `Camera`: will need per-camera motion zone polygons and gate sensitivity. Not yet added.

## Alternatives rejected

| Alternative | Why rejected |
| --- | --- |
| Consume ONVIF motion events from cameras | Vendor fragmentation; contradicts "any RTSP camera"; camera tuning is wrong for a cost filter (see D2) |
| Run YOLO on every frame, no gate | One to two orders of magnitude more inference on a workload that is idle most of the time |
| Detect on the main stream | Decoding 4K for inference is the single largest waste in a naive implementation |
| Adjacent-frame differencing for the gate | Misses slow movers approaching the camera head-on |
| Synchronous enrichment in the hot path | Couples alert latency to the most expensive model in the system |
| Celery for the enrichment queue | Job shape is too simple to justify the operational surface |
| Cloud inference APIs | Contradicts the local-first, privacy premise; adds per-event cost and network dependency |
| Buy into UniFi hardware | Cannot inspect, retrain, or evaluate closed models; the portfolio value is in the retraining loop |

## Metrics to instrument from day one

- Gate pass rate, per camera, bucketed by hour
- Detector invocations per minute
- Fraction of gate-passed frames that produced an actual detection (gate precision; if
  high, the gate is too strict)
- Enrichment queue depth and drop count
- End-to-end latency, motion to `Event` row written

Gate pass rate is the headline efficiency number for this design.

## Pricing and functionality comparison

Included for context. Pricing was explicitly weighted low in the decision.

| | UniFi Protect | VisionX |
| --- | --- | --- |
| Real-time person/vehicle | On-camera, free with G4+ | Worker, substream |
| Third-party ONVIF cameras | AI Port $199, 1-3 cameras | Native, any RTSP |
| Attributes, NL search, summaries | AI Key $799, 1,000-1,800/hr | Enrichment worker, hardware-limited |
| Software subscription | None | None |
| Entry AI cost | ~$199 | $0 CPU, ~$60 Coral, ~$250 used GPU |
| Custom / retrainable model | Not possible | Yes |
| Model evaluation visibility | None | Ours to build |

We cannot beat UniFi's camera silicon or hardware integration. We can beat their
flexibility, and on a single-home workload we can beat 1,000 events/hour on hardware
already owned.

## Implementation order

1. Motion gate only, in `worker/src/main.py`, reading `rtsp_sub_url`. No ML. Prove cheap
   frame pull and emit "something moved."
2. ONNX Runtime YOLO behind the gate. Write `Event` rows. Measure fps and gate pass rate.
3. Tracking and session clustering (D6).
4. Enrichment queue and CLIP embeddings (D5, D7).
5. Review UI and evaluation harness (D8).

## Open questions

- Detector runtime target: CPU, Coral TPU, or GPU? Affects model choice and quantization.
- Where do motion zone polygons live: `Camera` columns, a separate table, or a config file?
- Does `pgvector` go in the existing Postgres instance or a separate service?
- Postgres and the backend are not yet in `docker-compose.yaml` (only go2rtc is). The worker
  will need to join that compose stack.
- Retention policy for snapshots used as training data versus snapshots used for review.

## Sources

Researched 2026-07-26.

- [UniFi Protect Cameras - AI Detections and Facial Recognition](https://help.ui.com/hc/en-us/articles/360058867233-UniFi-Protect-Cameras-AI-Detections-and-Facial-Recognition)
- [UniFi AI Key Setup and FAQs](https://help.ui.com/hc/en-us/articles/29221435686039-UniFi-AI-Key-Setup-and-FAQs)
- [Protect AI Port FAQs](https://help.ui.com/hc/en-us/articles/28315005177239-Protect-AI-Port-FAQs)
- [Introducing Protect 7.0](https://blog.ui.com/article/introducing-protect-7-0)
- [UniFi AI Key Tech Specs](https://techspecs.ui.com/unifi/physical-security/ai-key)
- [AI Key - Ubiquiti Store US](https://store.ui.com/us/en/products/ai-key)
- [AI Port - Ubiquiti Store US](https://store.ui.com/us/en/products/up-ai-port)
- [Frigate Semantic Search docs](https://docs.frigate.video/configuration/semantic_search/)
- [Frigate Object Detectors docs](https://docs.frigate.video/configuration/object_detectors/)
- [Frigate+ Models docs](https://docs.frigate.video/plus/)
- [Frigate+ false positive discussion](https://github.com/blakeblackshear/frigate/discussions/20391)
