# Code walkthrough (interview notes)

All key modules include English comments describing **responsibility, data flow, tradeoffs and limitations**.

- `src/App.jsx`: navigation, REST state synchronization, debounced filtering, WebSocket reconnection and demo events.
- `src/components/CameraTile.jsx`: HTML5 playback, focused-camera AI overlay, cleanup of timers and Canvas rendering.
- `src/pages/AILab.jsx`: browser inference and posting detection metadata.
- `src/lib/api.js`: central API request/error handling.
- `server/index.js`: camera/video upload endpoints, event search, WebSocket broadcasts and local hosting.
- `server/db/database.js`: SQLite initialization, default cameras and source migration.
- `server/services/events.js`: validation and event provenance.
- `server/security.js`: local safeguards and production limitations.

## What is real vs simulated?

No stock footage is bundled or misrepresented as CCTV. Supply distinct, licensed MP4s through Camera Fleet. COCO-SSD bounding boxes are genuine browser inference. Demo-event generation is simulated and labeled with origin `demo`.

## Useful interview discussion

Why run inference on one focused stream? To bound CPU/GPU and memory usage. Why WebSocket + REST? The socket signals change while REST provides recoverable authoritative state. What would production need? Authentication, stream ingest/transcoding, retention policies, observability and per-camera inference scheduling.
