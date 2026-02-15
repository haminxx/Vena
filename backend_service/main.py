"""
FastAPI backend for stem separation.
POST /split-stems: Download audio via yt-dlp, split via Replicate Demucs.
Run: uvicorn main:app --reload --port 8000
"""
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Sync Stem Splitter")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SplitStemsRequest(BaseModel):
    artist: str
    track: str


class SplitStemsResponse(BaseModel):
    vocals: str
    drums: str
    bass: str
    other: str


def _run_ytdlp(query: str, out_path: Path) -> Path:
    """Search YouTube and download audio via yt-dlp."""
    import yt_dlp
    opts = {
        "format": "bestaudio/best",
        "outtmpl": str(out_path),
        "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "wav"}],
        "quiet": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([f"ytsearch1:{query} audio"])
    wav = out_path.with_suffix(".wav")
    return wav if wav.exists() else out_path


def _run_demucs(audio_path: Path) -> dict[str, str]:
    """Run Demucs via Replicate. Requires REPLICATE_API_TOKEN."""
    import replicate
    if not os.environ.get("REPLICATE_API_TOKEN"):
        raise HTTPException(status_code=500, detail="REPLICATE_API_TOKEN not set")
    with open(audio_path, "rb") as f:
        output = replicate.run("cjwbw/demucs", input={"audio": f})
    if not output:
        raise HTTPException(status_code=502, detail="Demucs returned no output")
    stems = output if isinstance(output, dict) else {}
    return {
        "vocals": stems.get("vocals", ""),
        "drums": stems.get("drums", ""),
        "bass": stems.get("bass", ""),
        "other": stems.get("other", ""),
    }


@app.post("/split-stems", response_model=SplitStemsResponse)
async def split_stems(req: SplitStemsRequest):
    """Download audio from YouTube, split into 4 stems via Demucs."""
    query = f"{req.artist} {req.track} audio".strip()
    if not query or query == "audio":
        raise HTTPException(status_code=400, detail="artist and track required")
    with tempfile.TemporaryDirectory() as tmp:
        out_path = Path(tmp) / "audio"
        try:
            audio_path = _run_ytdlp(query, out_path)
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"yt-dlp failed: {str(e)}")
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail="No audio found")
        try:
            stems = _run_demucs(audio_path)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Demucs failed: {str(e)}")
        return SplitStemsResponse(**stems)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
