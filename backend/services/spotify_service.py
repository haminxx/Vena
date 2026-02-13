"""Spotify Web API integration for audio features."""
import base64
from typing import Optional

import requests

from backend.config import settings


def _get_access_token() -> Optional[str]:
    """Get Spotify API access token via client credentials flow."""
    if not settings.spotify_client_id or not settings.spotify_client_secret:
        return None
    auth = base64.b64encode(
        f"{settings.spotify_client_id}:{settings.spotify_client_secret}".encode()
    ).decode()
    resp = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {auth}"},
        data={"grant_type": "client_credentials"},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    return resp.json().get("access_token")


def search_track(title: str, artist: str) -> Optional[str]:
    """Search for a track by title and artist. Returns Spotify track ID or None."""
    token = _get_access_token()
    if not token:
        return None
    q = f"track:{title} artist:{artist}"
    resp = requests.get(
        "https://api.spotify.com/v1/search",
        params={"q": q, "type": "track", "limit": 1},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    data = resp.json()
    tracks = data.get("tracks", {}).get("items", [])
    if not tracks:
        return None
    return tracks[0]["id"]


def get_audio_features(track_id: str) -> Optional[dict]:
    """Get audio features for a Spotify track."""
    token = _get_access_token()
    if not token:
        return None
    resp = requests.get(
        f"https://api.spotify.com/v1/audio-features/{track_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    if resp.status_code != 200:
        return None
    return resp.json()


def analyze_track(title: str, artist: str) -> dict:
    """
    Find track on Spotify and return audio features.
    Returns dict with bpm, energy, valence, danceability, key, etc.
    """
    result = {
        "spotify_track_id": None,
        "bpm": None,
        "tempo": None,
        "energy": None,
        "valence": None,
        "danceability": None,
        "key": None,
        "mode": None,
        "error": None,
    }
    track_id = search_track(title, artist)
    if not track_id:
        result["error"] = "Track not found on Spotify"
        return result
    result["spotify_track_id"] = track_id
    features = get_audio_features(track_id)
    if not features:
        result["error"] = "Could not fetch audio features"
        return result
    result["bpm"] = features.get("tempo")
    result["tempo"] = features.get("tempo")
    result["energy"] = features.get("energy")
    result["valence"] = features.get("valence")
    result["danceability"] = features.get("danceability")
    result["key"] = features.get("key")
    result["mode"] = features.get("mode")
    return result
