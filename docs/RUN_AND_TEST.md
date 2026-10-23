# Running and testing Sentinel/AI (Windows / VS Code)

## Requirements
- Node.js 22.13+ (24 works), npm, and a modern browser.
- Internet only for the initial `npm install` and first TensorFlow.js model download.

## Start
```powershell
npm.cmd install
npm.cmd run dev
```
Open http://localhost:5173. Both server and client start together.

## Try the complete workflow
1. **Command Center:** see 16 camera tiles playing four bundled looping synthetic MP4 clips.
2. **Camera Fleet:** add a camera, edit its direct browser-playable MP4 URL, toggle enabled, delete.
3. **Event Explorer:** toggle demo events on the Command Center and see events persist across refreshes.
4. **AI Detection Lab:** click **Use demo video** or upload a local MP4, select camera, click **Start AI**. The model loads from the internet on first use. It may detect no objects in synthetic clips; use a video containing visible people or vehicles to test detection.
5. **Analytics:** view aggregations from stored events.
6. **Export:** GET `/api/export/events.csv` for CSV.

## Verification
```powershell
npm.cmd test
npm.cmd run build
```
After build, `npm.cmd start` serves both API and built frontend at http://127.0.0.1:3001.

## Troubleshooting
- `EADDRINUSE 3001`: another server is already running. In PowerShell, `Get-NetTCPConnection -LocalPort 3001 -State Listen`; inspect its OwningProcess and stop the stale process only if safe.
- `npm.ps1 not digitally signed`: use `npm.cmd` instead of `npm`.
- Camera video blank: hard refresh, check Network for `/demo/camera-01.mp4` (should be 200), or check whether custom URL permits browser playback. RTSP is **not** directly playable in HTML5 video.
- AI model cannot load: connect to internet, reload, try again. AI model is not bundled for offline first use.
- SQLite data is saved in `server/data/sentinel.sqlite` (or `DATA_DIR`). Back it up before replacing a project folder.
- All videos are **synthetic demos** and are reused across cameras; no live CCTV feed is claimed.

## Scope
This is a local-first portfolio demo, not a production security surveillance platform. No authentication, RTSP gateway, scalable stream fanout, or guaranteed detection accuracy.
