/**
 * Embed Aggregator Providers & Sandbox Configurations
 * Based on Core System Architecture (Option 2)
 */

export const PROVIDERS = [
  {
    id: 'vidsrc-to',
    name: 'VidSrc (Primary)',
    badge: 'Fast',
    description: 'High-speed multi-quality HLS streams (vidsrc.to)',
    getMovieUrl: (tmdbId) => `https://vidsrc.to/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidlink',
    name: 'VidLink',
    badge: 'HD',
    description: 'Clean responsive player with subtitles support (vidlink.pro)',
    getMovieUrl: (tmdbId) => `https://vidlink.pro/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'embed-su',
    name: 'Embed.su',
    badge: 'Subtitles',
    description: 'Multi-lingual audio and subtitle streams (embed.su)',
    getMovieUrl: (tmdbId) => `https://embed.su/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'vidsrc-xyz',
    name: 'VidSrc XYZ',
    badge: 'Reliable',
    description: 'Alternative VidSrc cluster with query param routing (vidsrc.xyz)',
    getMovieUrl: (tmdbId) => `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
  },
  {
    id: 'autoembed',
    name: 'AutoEmbed',
    badge: 'Server 5',
    description: 'Automated fallback provider network (player.autoembed.cc)',
    getMovieUrl: (tmdbId) => `https://player.autoembed.cc/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) => `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'multiembed',
    name: 'MultiEmbed',
    badge: 'Backup',
    description: 'Aggregates streams from multiple mirrors (multiembed.mov)',
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTvUrl: (tmdbId, season, episode) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
]

export const SANDBOX_MODES = {
  STRICT: {
    id: 'strict',
    name: 'Strict Anti-Ad Sandbox',
    description: 'Blocks top-level parent window navigation and unwanted popups',
    value: 'allow-scripts allow-same-origin allow-forms',
    tooltip: 'Omits allow-top-navigation to prevent parent page redirects to ad networks.',
  },
  MODERATE: {
    id: 'moderate',
    name: 'Moderate Sandbox',
    description: 'Allows popups but prevents parent page redirects',
    value: 'allow-scripts allow-same-origin allow-forms allow-popups',
    tooltip: 'Permits new tabs while preventing direct hijacking of your current view.',
  },
  UNRESTRICTED: {
    id: 'unrestricted',
    name: 'Unrestricted (Compatibility)',
    description: 'No iframe sandboxing. Required by providers that detect sandbox',
    value: null,
    tooltip: 'Use if a player screen stays black or reports sandboxing restrictions.',
  },
}
