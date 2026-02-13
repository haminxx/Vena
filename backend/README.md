# Backend Setup

## 1. Install dependencies

```bash
cd backend
pip install -r requirements.txt
```

## 2. YouTube Music (ytmusicapi)

To use search and playlists, you need to authenticate with YouTube Music:

1. Run: `ytmusicapi setup`
2. Follow the prompts to paste your browser request headers from YouTube Music DevTools
3. This creates `browser.json` in the current directory
4. Copy `browser.json` into the `backend/` folder

Or manually create `browser.json` by:
- Open https://music.youtube.com in Chrome
- Open DevTools (F12) → Network tab
- Refresh and click any request → copy request headers
- Run `ytmusicapi setup` and paste when prompted

## 3. Spotify API

For audio features (BPM, energy, valence, etc.):

1. Create an app at https://developer.spotify.com/dashboard
2. Copy Client ID and Client Secret
3. Create `backend/.env`:

```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

## 4. Run the server

From the **project root** (Music Dig & Sync):

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Or from `backend/`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

(If running from backend/, you may need to adjust imports or set `PYTHONPATH=..`)
