# DigBrowser - Chrome-OS Music Explorer

A fake Chrome browser UI for music digging and syncing. Press F11 to start.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Add your Spotify credentials to `.env.local`

## Vercel Deployment

1. Connect your repo to Vercel
2. **Root Directory**: Leave empty if the repo root contains `package.json`
3. **Environment Variables** (Project Settings → Environment Variables):
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
4. Redeploy after adding env vars

## Tech Stack

- Next.js 15 (App Router)
- Tailwind CSS
- Lucide React
- ytmusic-api, Spotify API
