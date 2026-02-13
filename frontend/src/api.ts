/** API client for backend. */

const API_BASE = '/api';

export interface SearchTrack {
  yt_video_id: string;
  title: string;
  artist: string;
  duration?: string;
  duration_ms?: number;
}

export interface AudioFeatures {
  spotify_track_id?: string;
  bpm?: number;
  tempo?: number;
  energy?: number;
  valence?: number;
  danceability?: number;
  key?: number;
  mode?: number;
  error?: string;
}

export async function getRelatedSongs(videoId: string, limit = 24): Promise<SearchTrack[]> {
  const res = await fetch(
    `${API_BASE}/related/${encodeURIComponent(videoId)}?limit=${limit}`
  );
  if (!res.ok) throw new Error('Get related failed');
  return res.json();
}

export async function search(query: string, limit = 20): Promise<SearchTrack[]> {
  const res = await fetch(
    `${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}`
  );
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function createPlaylist(
  title: string,
  description: string,
  videoIds: string[]
): Promise<{ playlist_id: string }> {
  const res = await fetch(`${API_BASE}/playlists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description, video_ids: videoIds }),
  });
  if (!res.ok) throw new Error('Create playlist failed');
  return res.json();
}

export async function addPlaylistItems(
  playlistId: string,
  videoIds: string[]
): Promise<void> {
  const res = await fetch(`${API_BASE}/playlists/${playlistId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_ids: videoIds }),
  });
  if (!res.ok) throw new Error('Add playlist items failed');
}

export async function analyzeTrack(
  title: string,
  artist: string
): Promise<AudioFeatures> {
  const res = await fetch(`${API_BASE}/analyze-track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, artist }),
  });
  if (!res.ok) throw new Error('Analyze track failed');
  return res.json();
}
