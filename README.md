# Music Dig & Sync

A full-stack app for music digging (search, playlists) and syncing with Strudel live coding. Browser-style UI with F11 fullscreen, Chrome-like search bar, and dynamic gradient backgrounds.

## Stack

- **Backend:** Python, FastAPI, ytmusicapi, Spotify Web API
- **Frontend:** React, TypeScript, Vite
- **Music syncing:** Strudel (embedded)

## Quick start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

See [backend/README.md](backend/README.md) for:
- ytmusicapi setup (browser.json for YouTube Music auth)
- Spotify API credentials (.env)

Run from **project root**:

```bash
uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and press **F11** to start.

## Project structure

```
├── backend/           # Python FastAPI
│   ├── main.py        # API routes
│   ├── models.py      # Pydantic models
│   ├── services/      # ytmusicapi, Spotify
│   └── browser.json   # (you create) YT Music auth
├── frontend/          # React + TypeScript
│   └── src/
│       ├── App.tsx    # Main UI, tabs, search, playlist
│       └── api.ts     # Backend API client
├── index.html         # Legacy static entry (optional)
└── README.md
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /search?query=... | Search YouTube Music songs |
| GET | /related/{video_id} | Get similar/related songs for radial map |
| POST | /playlists | Create playlist |
| POST | /playlists/{id}/items | Add tracks to playlist |
| POST | /analyze-track | Get Spotify audio features (BPM, energy, etc.) |

## Modes

- **Music Digging:** Search YT Music, click ⊙ to view radial map with similar songs (colored by genre/mood), add to playlist
- **Music Syncing:** Embedded Strudel REPL for live coding patterns

## Deploy to Vercel

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your GitHub repo.
3. Set **Root Directory** to `frontend`.
4. Vercel will auto-detect Vite. Deploy.

Each push to `main` will trigger a new deployment.

**Note:** The backend (Python/FastAPI) must be deployed separately (e.g. Railway, Render). Update the frontend API base URL to point to your deployed backend.
