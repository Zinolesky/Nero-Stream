import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { PROVIDERS, SANDBOX_MODES } from '../services/providers'
import { tmdb } from '../services/tmdb'
import { EpisodePicker } from './EpisodePicker'
import {
  X,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
  Star,
  Info,
  RotateCw,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react'

export const PlayerView = () => {
  const {
    currentPlaying,
    closePlayer,
    activeProvider,
    updateProviderId,
    sandboxMode,
    sandboxConfig,
    updateSandboxMode,
    updatePlayingEpisode,
    toggleBookmark,
    isBookmarked,
  } = useApp()

  const [metadata, setMetadata] = useState(null)
  const [isTheater, setIsTheater] = useState(false)
  const [iframeKey, setIframeKey] = useState(Date.now())
  const [sandboxDropdownOpen, setSandboxDropdownOpen] = useState(false)
  const [serverDropdownOpen, setServerDropdownOpen] = useState(false)
  const iframeRef = useRef(null)

  const isTv = currentPlaying?.media_type === 'tv'
  const currentSeason = currentPlaying?.season || 1
  const currentEpisode = currentPlaying?.episode || 1

  // Fetch complete details (cast, seasons, genres)
  useEffect(() => {
    let isMounted = true
    const fetchMetadata = async () => {
      if (!currentPlaying) return
      try {
        const details = await tmdb.getDetails(currentPlaying.media_type, currentPlaying.id)
        if (isMounted) {
          setMetadata(details)
        }
      } catch (e) {
        console.error('Failed to fetch full media details', e)
      }
    }
    fetchMetadata()
    return () => {
      isMounted = false
    }
  }, [currentPlaying?.id, currentPlaying?.media_type])

  if (!currentPlaying) return null

  // Compute stream URL based on Option 2 architecture
  const streamUrl = isTv
    ? activeProvider.getTvUrl(currentPlaying.id, currentSeason, currentEpisode)
    : activeProvider.getMovieUrl(currentPlaying.id)

  const handleReloadIframe = () => {
    setIframeKey(Date.now())
  }

  const handleNextEpisode = () => {
    updatePlayingEpisode(currentSeason, currentEpisode + 1)
  }

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      updatePlayingEpisode(currentSeason, currentEpisode - 1)
    }
  }

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (iframeRef.current.requestFullscreen) {
        iframeRef.current.requestFullscreen()
      } else if (iframeRef.current.webkitRequestFullscreen) {
        iframeRef.current.webkitRequestFullscreen()
      }
    }
  }

  const bookmarked = isBookmarked(currentPlaying.id, currentPlaying.media_type)

  return (
    <div className="relative w-full bg-slate-950 text-slate-100 min-h-screen pb-16 animate-in fade-in duration-300">
      {/* Player Sticky / Control Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={closePlayer}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700/60"
            title="Return to browsing"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Browse</span>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
              {isTv ? <Tv className="w-4 h-4 text-purple-400 shrink-0" /> : <Film className="w-4 h-4 text-rose-500 shrink-0" />}
              <span className="truncate">{currentPlaying.title || currentPlaying.name}</span>
            </h2>
            {isTv && (
              <p className="text-xs text-rose-400 font-medium">
                Season {currentSeason} • Episode {currentEpisode}
              </p>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* TV Quick Next/Prev Episode */}
          {isTv && (
            <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/60 p-0.5">
              <button
                onClick={handlePrevEpisode}
                disabled={currentEpisode <= 1}
                className="p-1.5 text-slate-300 hover:text-white disabled:opacity-40 disabled:hover:text-slate-300 transition-colors"
                title="Previous Episode"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs px-2 font-mono text-rose-400">
                S{currentSeason}:E{currentEpisode}
              </span>
              <button
                onClick={handleNextEpisode}
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
                title="Next Episode"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bookmark Button */}
          <button
            onClick={() => toggleBookmark(currentPlaying)}
            className={`p-2 rounded-lg border transition-colors ${
              bookmarked
                ? 'bg-rose-950/50 border-rose-600 text-rose-400'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title={bookmarked ? 'In My List' : 'Add to My List'}
          >
            {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>

          {/* External Link */}
          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Open stream in new tab (if adblocker blocks iframe)"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            onClick={closePlayer}
            className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 transition-colors"
            title="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`mx-auto transition-all duration-300 px-3 sm:px-6 pt-4 ${isTheater ? 'max-w-full' : 'max-w-6xl'}`}>
        {/* Stream Provider Switcher & Security Controls Bar */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-3 sm:p-4 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
          {/* Server Switcher */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Server className="w-3.5 h-3.5 text-rose-400" />
              Stream Server:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PROVIDERS.map((provider, index) => {
                const isActive = provider.id === activeProvider.id
                return (
                  <button
                    key={provider.id}
                    onClick={() => updateProviderId(provider.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                      isActive
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>Server {index + 1}</span>
                    <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${isActive ? 'bg-black/30 text-rose-100' : 'bg-slate-800 text-slate-400'}`}>
                      {provider.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sandbox & Controls */}
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Sandbox Mode Selector */}
            <div className="relative">
              <button
                onClick={() => setSandboxDropdownOpen(!sandboxDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
                title="Configure iframe sandboxing security mode"
              >
                {sandboxMode === 'strict' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : sandboxMode === 'moderate' ? (
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Sandbox: {sandboxConfig.name.split(' ')[0]}</span>
              </button>

              {sandboxDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800">
                    Ad Mitigation Sandboxing
                  </h4>
                  <div className="space-y-1.5">
                    {Object.values(SANDBOX_MODES).map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          updateSandboxMode(mode.id)
                          setSandboxDropdownOpen(false)
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                          sandboxMode === mode.id
                            ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{mode.name}</span>
                        <span className="text-[11px] text-slate-400 leading-tight">{mode.description}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-800 leading-tight">
                    *Omitting allow-top-navigation prevents embed players from redirecting your parent window to ad networks.
                  </p>
                </div>
              )}
            </div>

            {/* Refresh Player */}
            <button
              onClick={handleReloadIframe}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
              title="Reload Stream Player"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={handleFullscreen}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
              title="Full screen player"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Player Box */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl shadow-black/80">
          <iframe
            key={`${currentPlaying.id}-${currentSeason}-${currentEpisode}-${activeProvider.id}-${sandboxMode}-${iframeKey}`}
            ref={iframeRef}
            src={streamUrl}
            title={currentPlaying.title || currentPlaying.name}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="origin"
            {...(sandboxConfig.value ? { sandbox: sandboxConfig.value } : {})}
          />
        </div>

        {/* Helpful Tip for Streams & Popups */}
        <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              If a server is buffering or displays a playback notice, switch to{' '}
              <strong className="text-slate-200">Server 2 (VidLink)</strong> or{' '}
              <strong className="text-slate-200">Server 3 (Embed.su)</strong>.
            </span>
          </div>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-500">
            Source: {activeProvider.name}
          </span>
        </div>

        {/* TV Series Episode Drawer */}
        {isTv && (
          <div className="mt-8">
            <EpisodePicker
              tvId={currentPlaying.id}
              currentSeason={currentSeason}
              currentEpisode={currentEpisode}
              totalSeasons={metadata?.number_of_seasons || currentPlaying.number_of_seasons || 1}
              seasons={metadata?.seasons || []}
              onSelectEpisode={(s, e) => updatePlayingEpisode(s, e)}
            />
          </div>
        )}

        {/* Metadata & Title Details */}
        <div className="mt-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Poster Thumbnail */}
            {currentPlaying.poster_path && (
              <img
                src={tmdb.getImageUrl(currentPlaying.poster_path, 'w300')}
                alt={currentPlaying.title || currentPlaying.name}
                className="w-32 h-48 rounded-xl object-cover shrink-0 shadow-lg border border-slate-700/60 hidden sm:block"
              />
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {currentPlaying.title || currentPlaying.name}
                </h1>
                {currentPlaying.vote_average && (
                  <span className="flex items-center gap-1 text-sm font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                    {currentPlaying.vote_average.toFixed(1)}
                  </span>
                )}
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                {metadata?.release_date && (
                  <span className="text-xs text-slate-400">
                    {new Date(metadata.release_date).getFullYear()}
                  </span>
                )}
                {metadata?.runtime && (
                  <span className="text-xs text-slate-400">
                    {metadata.runtime} minutes
                  </span>
                )}
              </div>

              {/* Genres */}
              {metadata?.genres && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {metadata.genres.map((g) => (
                    <span
                      key={g.id}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/70"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-4xl">
                {metadata?.overview || currentPlaying.overview || 'No overview provided.'}
              </p>

              {/* Cast & Crew if available */}
              {metadata?.credits?.cast && metadata.credits.cast.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Starring
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {metadata.credits.cast
                      .slice(0, 6)
                      .map((c) => c.name)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
