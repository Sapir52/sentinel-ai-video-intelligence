# Architecture

React/Vite frontend communicates with Express REST endpoints. SQLite persists cameras and events. WebSocket broadcasts event and camera changes; the client reconnects after disconnection. TensorFlow.js COCO-SSD runs in-browser on uploaded videos, drawing detection overlays to Canvas and posting throttled metadata to the API. No video is uploaded.

## Boundaries
- `src/components`: reusable UI
- `src/pages`: local inference UI
- `src/lib`: API utilities
- `server/db`: SQLite schema and seed data
- `server/services`: event validation and publishing
- `server/index.js`: HTTP and WebSocket transport

## Limitations
This is a portfolio demonstration, not a production surveillance solution. Camera URLs must be browser-playable; RTSP is not supported. There is no authentication, rate limiting, stream transcoding, or true multi-user permissions. Run locally only.
