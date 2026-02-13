# Music Dig & Sync

A browser-style frontend that launches in fullscreen (F11) with a Chrome-like search bar, toolbar, and a background that changes to a gradient based on the element you hover over.

## Run locally

1. Open the project folder in your editor or terminal.
2. Serve the files with any static server, or open `index.html` in your browser.
   - **Option A:** Double-click `index.html` (some features like fullscreen work best with a real server).
   - **Option B:** From the project folder run:
     - **Node:** `npx serve .` then visit the URL shown (e.g. http://localhost:3000).
     - **Python 3:** `python -m http.server 8000` then visit http://localhost:8000.

3. Press **F11** to enter fullscreen and see the browser UI. Hover over the search box, toolbar buttons, or keywords to see the background gradient change to that element’s color.

## Pushing to GitHub

You said you’ll create a new repo. Here’s what to do.

### What I need from you

1. **A new GitHub repo**  
   Create it at https://github.com/new (e.g. name: `music-dig-sync`).  
   - Do **not** add a README, .gitignore, or license when creating the repo (the project already has a README).

2. **The repo URL**  
   It will look like one of these:
   - HTTPS: `https://github.com/YOUR_USERNAME/music-dig-sync.git`
   - SSH: `git@github.com:YOUR_USERNAME/music-dig-sync.git`

### Commands to run (in your project folder)

In PowerShell or Command Prompt, from the **Music Dig & Sync** folder:

```bash
# 1. Initialize Git (if not already)
git init

# 2. Stage all files
git add .

# 3. First commit
git commit -m "Initial commit: browser-style UI with F11 fullscreen and hover gradient"

# 4. Add your GitHub repo as remote (replace with YOUR repo URL)
git remote add origin https://github.com/YOUR_USERNAME/music-dig-sync.git

# 5. Push to GitHub (main branch)
git branch -M main
git push -u origin main
```

Replace `https://github.com/YOUR_USERNAME/music-dig-sync.git` with the URL of the repo you created.

If you use SSH and have keys set up, use:

`git remote add origin git@github.com:YOUR_USERNAME/music-dig-sync.git`

---

**Customization (for later):**

- **Background by selection:** The “selected” theme can be wired to a dropdown or buttons; we can add that when you define what “user select” is.
- **Keywords / boxes and colors:** Add or change elements with a `data-color="#hex"` attribute (e.g. `data-color="#4a90d9"`). Any element with `data-color` will drive the page background gradient on hover.
