"""FastAPI backend for Music Dig & Sync."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.models import (
    AnalyzeTrackRequest,
    AnalyzeTrackResponse,
    CreatePlaylistRequest,
    AddPlaylistItemsRequest,
)
from backend.services import ytmusic_service, spotify_service

app = FastAPI(title="Music Dig & Sync API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/related/{video_id}")
def get_related(video_id: str, limit: int = 24):
    """Get similar/related songs for a track (for radial map)."""
    try:
        return ytmusic_service.get_related_songs(video_id, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
def search(query: str, limit: int = 20):
    """Search YouTube Music for songs."""
    if not query or not query.strip():
        return []
    try:
        return ytmusic_service.search_songs(query.strip(), limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/playlists")
def create_playlist(req: CreatePlaylistRequest):
    """Create a new YouTube Music playlist."""
    try:
        playlist_id = ytmusic_service.create_playlist(
            title=req.title,
            description=req.description,
            video_ids=req.video_ids,
        )
        return {"playlist_id": playlist_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/playlists/{playlist_id}/items")
def add_playlist_items(playlist_id: str, req: AddPlaylistItemsRequest):
    """Add tracks to an existing playlist."""
    try:
        ytmusic_service.add_playlist_items(playlist_id, req.video_ids)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-track", response_model=AnalyzeTrackResponse)
def analyze_track(req: AnalyzeTrackRequest):
    """Get Spotify audio features for a track by title and artist."""
    result = spotify_service.analyze_track(req.title, req.artist)
    return AnalyzeTrackResponse(**result)


@app.get("/health")
def health():
    return {"status": "ok"}
