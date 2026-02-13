"""Data models for the API."""
from pydantic import BaseModel
from typing import Optional


class Track(BaseModel):
    """Internal track representation."""
    id: Optional[str] = None
    yt_video_id: str
    title: str
    artist: str
    duration_ms: Optional[int] = None
    spotify_track_id: Optional[str] = None
    tempo: Optional[float] = None
    energy: Optional[float] = None
    valence: Optional[float] = None
    danceability: Optional[float] = None
    key: Optional[int] = None


class AnalyzeTrackRequest(BaseModel):
    title: str
    artist: str


class AnalyzeTrackResponse(BaseModel):
    spotify_track_id: Optional[str] = None
    bpm: Optional[float] = None
    tempo: Optional[float] = None
    energy: Optional[float] = None
    valence: Optional[float] = None
    danceability: Optional[float] = None
    key: Optional[int] = None
    mode: Optional[int] = None
    error: Optional[str] = None


class CreatePlaylistRequest(BaseModel):
    title: str
    description: str = ""
    video_ids: list[str] = []


class AddPlaylistItemsRequest(BaseModel):
    video_ids: list[str]
