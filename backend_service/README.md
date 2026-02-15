# Sync Stem Separation Backend

Python FastAPI service for splitting tracks into 4 stems (Vocals, Drums, Bass, Other).

## Setup

Requires **FFmpeg** (for yt-dlp audio extraction). Install via your package manager.

```bash
cd backend_service
python -m venv venv
# Windows: venv\Scripts\activate
# Unix: source venv/bin/activate
pip install -r requirements.txt
```

## Environment

- `REPLICATE_API_TOKEN` — Required for Demucs stem separation. Get from [replicate.com](https://replicate.com).

## Run

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

- `POST /split-stems` — `{ "artist": "...", "track": "..." }` → `{ "vocals", "drums", "bass", "other" }` URLs
- `GET /health` — Health check

## Pipeline

1. Search YouTube via yt-dlp for `"{artist} {track} audio"`
2. Download audio (WAV)
3. Run Demucs on Replicate
4. Return 4 stem URLs
