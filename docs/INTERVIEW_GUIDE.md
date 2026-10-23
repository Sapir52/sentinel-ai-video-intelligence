# Interview discussion

1. Why is AI inference performed client-side? Privacy and zero server GPU cost, but CPU/GPU constraints apply.
2. Why throttle detections? Avoid writing one event per frame; production systems would use tracking and deduplication.
3. How to scale to 16 real feeds? HLS/WebRTC gateway, adaptive bitrate, visible-feed playback and stream health monitoring.
4. How to prevent memory leaks? Revoke object URLs, stop inference loops, remove WebSocket listeners, clean up media tracks.
5. What changes in production? Authentication, camera access control, background queues, monitoring, video retention policies and audit logs.
