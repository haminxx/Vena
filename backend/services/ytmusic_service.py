"""ytmusicapi integration for YouTube Music search and playlists."""
from pathlib import Path
from typing import Optional

from ytmusicapi import YTMusic


def _get_ytmusic() -> Optional[YTMusic]:
    """Get YTMusic client. Uses browser.json if present."""
    config = Path(__file__).resolve().parent.parent / "browser.json"
    if config.exists():
        return YTMusic(str(config))
    # Fallback: try without auth (limited search)
    return YTMusic()


def search_songs(query: str, limit: int = 20) -> list[dict]:
    """
    Search for songs on YouTube Music.
    Returns list of track-like dicts with videoId, title, artists, duration, etc.
    """
    try:
        yt = _get_ytmusic()
        results = yt.search(query, filter="songs", limit=limit)
        tracks = []
        for r in results:
            if "videoId" not in r:
                continue
            duration = r.get("duration")
            duration_ms = None
            if duration:
                parts = duration.split(":")
                if len(parts) == 2:
                    duration_ms = int(parts[0]) * 60000 + int(parts[1]) * 1000
                elif len(parts) == 3:
                    duration_ms = int(parts[0]) * 3600000 + int(parts[1]) * 60000 + int(parts[2]) * 1000
            artists = r.get("artists", [])
            artist = artists[0].get("name", "Unknown") if artists else "Unknown"
            tracks.append({
                "yt_video_id": r["videoId"],
                "title": r.get("title", ""),
                "artist": artist,
                "duration": duration,
                "duration_ms": duration_ms,
            })
        return tracks
    except Exception as e:
        raise RuntimeError(f"ytmusicapi search failed: {e}") from e


def create_playlist(title: str, description: str = "", video_ids: list[str] | None = None) -> Optional[str]:
    """Create a playlist and optionally add tracks. Returns playlist ID."""
    try:
        yt = _get_ytmusic()
        playlist_id = yt.create_playlist(title, description, video_ids=video_ids or [])
        return playlist_id
    except Exception as e:
        raise RuntimeError(f"ytmusicapi create_playlist failed: {e}") from e


def add_playlist_items(playlist_id: str, video_ids: list[str]) -> None:
    """Add tracks to an existing playlist."""
    try:
        yt = _get_ytmusic()
        yt.add_playlist_items(playlist_id, video_ids)
    except Exception as e:
        raise RuntimeError(f"ytmusicapi add_playlist_items failed: {e}") from e


def get_related_songs(video_id: str, limit: int = 24) -> list[dict]:
    """
    Get similar/related songs via watch playlist (radio mode).
    Returns list of track dicts with videoId, title, artists, duration, etc.
    """
    try:
        yt = _get_ytmusic()
        result = yt.get_watch_playlist(videoId=video_id, limit=limit, radio=True)
        tracks = result.get("tracks", [])
        out = []
        for r in tracks:
            if "videoId" not in r:
                continue
            artists = r.get("artists", [])
            artist = artists[0].get("name", "Unknown") if artists else "Unknown"
            length = r.get("length", "")
            duration_ms = None
            if length:
                parts = length.split(":")
                if len(parts) == 2:
                    duration_ms = int(parts[0]) * 60000 + int(parts[1]) * 1000
                elif len(parts) == 3:
                    duration_ms = int(parts[0]) * 3600000 + int(parts[1]) * 60000 + int(parts[2]) * 1000
            out.append({
                "yt_video_id": r["videoId"],
                "title": r.get("title", ""),
                "artist": artist,
                "duration": length,
                "duration_ms": duration_ms,
            })
        return out
    except Exception as e:
        raise RuntimeError(f"ytmusicapi get_related failed: {e}") from e
