/**
 * Embed Aggregator Providers & Sandbox Configurations
 * Based on Core System Architecture (Option 2)
 */

export const PROVIDERS = [
  {
    id: 'vidlink',
    name: 'VidLink (Ad-Free HD)',
    badge: 'Clean • Subs',
    description: 'Clean responsive player with subtitles & auto-resume (vidlink.pro)',
    getMovieUrl: (tmdbId, startAt) =>
      `https://vidlink.pro/movie/${tmdbId}${startAt && startAt > 15 ? `?startAt=${Math.floor(startAt)}` : ''}`,
    getTvUrl: (tmdbId, season, episode, startAt) =>
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}${startAt && startAt > 15 ? `?startAt=${Math.floor(startAt)}` : ''}`,
  },
  {
    id: 'vidsrc-sh',
    name: 'VidSrc SH (Fast)',
    badge: 'Fast Stream',
    description: 'Direct high-speed TMDB query cluster (vidsrc.sh)',
    getMovieUrl: (tmdbId) => `https://vidsrc.sh/embed/movie?tmdb=${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.sh/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
  },
  {
    id: 'vidsrc-to',
    name: 'VidSrc TO (Backup)',
    badge: 'HLS',
    description: 'Multi-quality backup stream (vidsrc.to)',
    getMovieUrl: (tmdbId) => `https://vidsrc.to/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrc-pm',
    name: 'VidSrc PM (Mirror)',
    badge: 'Backup',
    description: 'High-uptime European mirror cluster (vidsrc.pm)',
    getMovieUrl: (tmdbId) => `https://vidsrc.pm/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.pm/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    badge: 'Multi-Host',
    description: 'Aggregates streams from multiple global mirrors (multiembed.mov)',
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTvUrl: (tmdbId, season, episode) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: '2embed',
    name: '2Embed (Legacy)',
    badge: 'Fallback',
    description: 'Legacy fallback embed host (2embed.cc)',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embed/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
]

export const SANDBOX_MODES = {
  UNRESTRICTED: {
    id: 'unrestricted',
    name: 'Unrestricted (Recommended)',
    description: 'No sandbox attribute. Required by all modern providers to allow video playback',
    value: null,
    tooltip: 'Standard mode. Prevents the "content cannot be embedded in a sandboxed frame" error.',
  },
  MODERATE: {
    id: 'moderate',
    name: 'Moderate Sandbox',
    description: 'Allows popups but prevents parent page redirects',
    value: 'allow-scripts allow-same-origin allow-forms allow-popups',
    tooltip: 'Permits new tabs while preventing direct hijacking of your current view.',
  },
  STRICT: {
    id: 'strict',
    name: 'Strict Anti-Ad Sandbox',
    description: 'Blocks parent window navigation & popups (May trigger provider sandbox block)',
    value: 'allow-scripts allow-same-origin allow-forms',
    tooltip: 'Omits allow-top-navigation. Note: Modern providers may refuse playback in this mode.',
  },
}
