# StreamVault — Modern Embed Aggregator Movie & TV Streaming Architecture (Option 2)

A fast, responsive web application for commercial movies and episodic TV series built on the **Option 2 Embed Aggregator Architecture**.

StreamVault requires **zero local video storage** and incurs **zero streaming bandwidth or video transcoding costs**. Metadata and imagery are delivered by the **TMDB API**, while media streaming is delegated to a fault-tolerant multi-server array of third-party embed providers with ad-mitigation iframe sandboxing.

---

## System Architecture

```text
+-----------------------------------------------------------+
|                     Client Browser                        |
|                                                           |
|  +---------------------+      +------------------------+  |
|  |   TMDB API Layer    |      |     Iframe Player      |  |
|  |  (Posters, Cast,    |      |  (Dynamically rendered |  |
|  |   Seasons/Episodes) |      |   via Provider URL)    |  |
|  +----------+----------+      +-----------+------------+  |
+-------------|-----------------------------|---------------+
              |                             |
              v                             v
     [api.themoviedb.org]        [Third-Party Embed Host]
     Free Metadata & Images      HLS / MP4 Stream Delivery
```

### 1. Metadata Layer (TMDB API)
- Client-side queries fetch trending titles, category rows, high-resolution posters, backdrops, cast bios, and season/episode rundowns.
- Supports instant debounced multi-search across all movies and series.
- Integrated **Demo Catalog** with verified TMDB titles out of the box; live catalog activates seamlessly when a free TMDB API key is provided.

### 2. Playback Layer (Embed Aggregation)
Episodic television introduces nested routing which StreamVault resolves dynamically:

* **Movies:** Single unique TMDB or IMDb ID:
  ```text
  https://vidsrc.to/embed/movie/{tmdb_id}
  ```
* **TV Series:** Tri-part routing with series ID, season number, and episode number:
  ```text
  https://vidsrc.to/embed/tv/{tmdb_id}/{season_number}/{episode_number}
  ```
  The UI queries TMDB for the season list and episode count, renders an interactive episode picker with thumbnails and summaries, and updates the embed source dynamically.

---

## Practical Engineering Implementations

### Multi-Server Fallback Array (Provider Rotation)
Third-party embed hosts face domain blocks or server downtime. StreamVault maintains 6 independent provider mirrors with an instant one-click toggle directly in the player bar:

| Server | Provider | URL Pattern (Movie) | URL Pattern (TV) |
|---|---|---|---|
| **Server 1** | VidSrc.to (Primary) | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` |
| **Server 2** | VidLink.pro (HD) | `/movie/{id}` | `/tv/{id}/{s}/{e}` |
| **Server 3** | Embed.su (Subtitles) | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` |
| **Server 4** | VidSrc XYZ (Cluster) | `/embed/movie?tmdb={id}` | `/embed/tv?tmdb={id}&season={s}&episode={e}` |
| **Server 5** | AutoEmbed | `/embed/movie/{id}` | `/embed/tv/{id}/{s}/{e}` |
| **Server 6** | MultiEmbed (Mirror) | `/?video_id={id}&tmdb=1` | `/?video_id={id}&tmdb=1&s={s}&e={e}` |

### Ad Mitigation & Sandboxing
Embed hosts monetize their streams through intrusive pop-under ads. Unwanted page redirects are neutralized using configurable `iframe` sandboxing:

```html
<iframe 
  src="https://vidsrc.to/embed/movie/550" 
  sandbox="allow-scripts allow-same-origin allow-forms" 
  allowfullscreen>
</iframe>
```

* **Strict Sandbox (Default):** `allow-scripts allow-same-origin allow-forms`  
  *Omitting `allow-top-navigation` prevents the embed player from redirecting the parent window to advertising networks.*
* **Moderate Sandbox:** `allow-scripts allow-same-origin allow-forms allow-popups`  
  *Permits secondary tabs while continuing to guard the parent window.*
* **Unrestricted Mode:** Standby mode for providers that actively detect and refuse playback under sandboxing.

---

## Quick Start

### Prerequisites
- Node.js 18+ (tested with Node.js 24)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
```
The output directory is `/dist`, ready to deploy to any static host.

---

## TMDB API Key Configuration

StreamVault allows configuring the TMDB API key in two ways:
1. **In-App Settings Modal (Recommended):** Click **Settings** in the top navigation bar. Paste your API key and click **Verify Key**. It is verified in real-time against TMDB and saved in browser `localStorage`.
2. **Environment Variable:** Copy `.env.example` to `.env` and set:
   ```env
   VITE_TMDB_API_KEY=your_key_here
   ```

*To obtain a free TMDB API key:*
1. Sign up for free at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings > API > Request an API Key (Developer)**.
3. Copy your 32-character **API Key (v3 auth)**.

---

## Free Static Deployment

Because this application runs entirely client-side without a custom backend or raw media storage:

### Vercel
```bash
npx vercel
```
Set build command: `npm run build`, output directory: `dist`.

### Netlify
```bash
npx netlify deploy --prod --dir=dist
```

### Cloudflare Pages
1. Link your Git repository.
2. Build command: `npm run build`.
3. Build output directory: `dist`.
