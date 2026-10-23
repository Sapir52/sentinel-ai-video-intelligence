# Sixteen real video feeds (no synthetic footage)

The application is fully local and free, but **does not ship with third-party stock footage**. A fresh installation will show empty camera tiles until you add licensed MP4 videos. We intentionally do not misrepresent repeated or generated animations as independent CCTV feeds.

## Option A: use Camera Fleet

Start `npm.cmd run dev`, open Camera Fleet, and upload a distinct MP4 to each camera. The server saves each clip in `public/uploads/`, persists the mapping in SQLite, and rejects identical uploaded files across different cameras.

## Option B: install sixteen licensed stock clips at once

1. Obtain 16 independently filmed MP4s with licenses allowing your intended redistribution or demo use. Good subjects: entrance, parking, lobby, loading dock, corridor, warehouse, gate, rooftop, elevator hall, road, reception, office, stairs, garden, garage, service entrance.
2. Copy `scripts/video-sources.example.json` to `scripts/video-sources.json` and replace every URL with a **direct HTTPS MP4 URL** (not a webpage).
3. Run `node scripts/install-videos.mjs scripts/video-sources.json`.
4. Run `npm.cmd run verify:videos` to confirm 16 unique MP4 containers.
5. Restart the app. Cameras that still have an empty or legacy demo source will be mapped to the local clips. Custom camera sources are preserved.

If you want the videos inside your GitHub repository, check the license and file sizes. Standard GitHub repositories are not suited to large videos; Git LFS or a separate asset download is usually better.

## AI accuracy

COCO-SSD bounding boxes run on a *focused* camera when you select `Enable AI overlay`. Detection depends on the model, actual content, browser resources, and first-time model download. No detection boxes are fabricated. A simulated event is clearly labeled as such and is not evidence of model inference.
