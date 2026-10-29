import React, { useState, useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { useApp } from '../context/AppContext'
import { PROVIDERS, SANDBOX_MODES } from '../services/providers'
import { tmdb } from '../services/tmdb'
import { EpisodePicker } from './EpisodePicker'
import {
  X,
  Server,
  Shield,
  ShieldCheck,
  Maximize2,
  Minimize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
  Star,
  Info,
  RotateCw,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  AlertTriangle,
  Clock,
  Sun,
  Volume2,
  VolumeX,
  Play,
  Pause,
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
    updatePlaybackProgress,
    toggleBookmark,
    isBookmarked,
  } = useApp()

  const [metadata, setMetadata] = useState(null)
  const [iframeKey, setIframeKey] = useState(Date.now())
  const [sandboxDropdownOpen, setSandboxDropdownOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [startAtOverride, setStartAtOverride] = useState(null)
  const [showResumeBanner, setShowResumeBanner] = useState(true)

  // Sleek In-App VLC & Samsung Gesture UI (All disappear in <= 1 second)
  const [brightness, setBrightness] = useState(1.0) // 0.25 to 1.5
  const [brightnessPill, setBrightnessPill] = useState(null) // { percent }
  const [volumePill, setVolumePill] = useState(null) // { percent }
  const [seekPill, setSeekPill] = useState(null) // { direction: 'back' | 'forward' }
  const [playPausePill, setPlayPausePill] = useState(null) // { action: 'play' | 'pause' }
  const isVideoPausedRef = useRef(false)

  const playerContainerRef = useRef(null)
  const iframeRef = useRef(null)
  const brightnessTimerRef = useRef(null)
  const volumeTimerRef = useRef(null)
  const seekTimerRef = useRef(null)
  const playPauseTimerRef = useRef(null)

  const isNative = Capacitor.isNativePlatform()
  const isTv = currentPlaying?.media_type === 'tv'
  const currentSeason = currentPlaying?.season || 1
  const currentEpisode = currentPlaying?.episode || 1

  // Determine starting timestamp (Netflix resume)
  const effectiveStartAt =
    startAtOverride !== null
      ? startAtOverride
      : (currentPlaying?.startAt && currentPlaying.startAt > 15 ? currentPlaying.startAt : 0)

  // Unobtrusive in-app VLC & Samsung indicators (Auto-fade in <= 1 second)
  const triggerBrightnessPill = (percent) => {
    if (brightnessTimerRef.current) clearTimeout(brightnessTimerRef.current)
    setBrightnessPill({ percent })
    brightnessTimerRef.current = setTimeout(() => {
      setBrightnessPill(null)
    }, 1000)
  }

  const triggerVolumePill = (percent) => {
    if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current)
    setVolumePill({ percent })
    volumeTimerRef.current = setTimeout(() => {
      setVolumePill(null)
    }, 1000)
  }

  const triggerSeekPill = (direction) => {
    if (seekTimerRef.current) clearTimeout(seekTimerRef.current)
    setSeekPill({ direction })
    seekTimerRef.current = setTimeout(() => {
      setSeekPill(null)
    }, 1000)
  }

  const triggerPlayPausePill = (action) => {
    if (playPauseTimerRef.current) clearTimeout(playPauseTimerRef.current)
    setPlayPausePill({ action })
    playPauseTimerRef.current = setTimeout(() => {
      setPlayPausePill(null)
    }, 1000)
  }

  // Activate Native VLC Gestures on Android & synchronize physical video bounds
  useEffect(() => {
    if (window.AndroidMediaBridge?.setPlayerActive) {
      window.AndroidMediaBridge.setPlayerActive(true)
    }

    const updateVideoBounds = () => {
      if (playerContainerRef.current && window.AndroidMediaBridge?.setVideoBounds) {
        const rect = playerContainerRef.current.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        window.AndroidMediaBridge.setVideoBounds(
          Math.round(rect.left * dpr),
          Math.round(rect.top * dpr),
          Math.round(rect.right * dpr),
          Math.round(rect.bottom * dpr),
          isFullscreen
        )
      }
    }

    // Measure immediately and after short layout settle delays
    updateVideoBounds()
    const rAF = requestAnimationFrame(updateVideoBounds)
    const t1 = setTimeout(updateVideoBounds, 250)
    const t2 = setTimeout(updateVideoBounds, 600)

    window.addEventListener('resize', updateVideoBounds)
    window.addEventListener('scroll', updateVideoBounds, { passive: true })

    // Register native gesture event listeners from Android MainActivity
    window.onNativeBrightnessChanged = (percent) => {
      const bVal = Math.max(0.25, Math.min(1.5, percent / 100))
      setBrightness(bVal)
      triggerBrightnessPill(percent)
    }

    window.onNativeVolumeChanged = (percent) => {
      triggerVolumePill(percent)
    }

    window.onNativePlayPause = () => {
      isVideoPausedRef.current = !isVideoPausedRef.current
      const action = isVideoPausedRef.current ? 'pause' : 'play'
      triggerPlayPausePill(action)
      if (action === 'play') {
        setShowResumeBanner(false)
      }
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'NERO_PLAY_PAUSE' }, '*')
        }
      } catch (err) {
        console.warn('Could not post NERO_PLAY_PAUSE message', err)
      }
    }

    window.onNativeSeek = (delta) => {
      triggerSeekPill(delta < 0 ? 'back' : 'forward')
      try {
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({ type: 'NERO_SEEK', delta }, '*')
        }
      } catch (err) {
        console.warn('Could not post NERO_SEEK message', err)
      }
    }

    // Ensure audio starts unmuted and at 100% volume
    const unmuteT1 = setTimeout(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage({ type: 'NERO_UNMUTE' }, '*')
      } catch (e) {}
    }, 500)
    const unmuteT2 = setTimeout(() => {
      try {
        iframeRef.current?.contentWindow?.postMessage({ type: 'NERO_UNMUTE' }, '*')
      } catch (e) {}
    }, 1500)

    return () => {
      cancelAnimationFrame(rAF)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(unmuteT1)
      clearTimeout(unmuteT2)
      if (brightnessTimerRef.current) clearTimeout(brightnessTimerRef.current)
      if (volumeTimerRef.current) clearTimeout(volumeTimerRef.current)
      if (seekTimerRef.current) clearTimeout(seekTimerRef.current)
      if (playPauseTimerRef.current) clearTimeout(playPauseTimerRef.current)
      window.removeEventListener('resize', updateVideoBounds)
      window.removeEventListener('scroll', updateVideoBounds)
      if (window.AndroidMediaBridge?.setPlayerActive) {
        window.AndroidMediaBridge.setPlayerActive(false)
      }
      delete window.onNativeBrightnessChanged
      delete window.onNativeVolumeChanged
      delete window.onNativePlayPause
      delete window.onNativeSeek
    }
  }, [isFullscreen])

  // Fetch full TMDB metadata (cast, seasons, genres, runtimes)
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

  // Listen to VidLink postMessage events for real-time playback position & duration
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'PLAYER_EVENT' && event.data.data) {
            const { currentTime, duration } = event.data.data
            if (typeof currentTime === 'number' && !isNaN(currentTime)) {
              if (updatePlaybackProgress) {
                updatePlaybackProgress(currentTime, duration || 0)
              }
            }
          }
        }
      } catch (err) {
        console.warn('Error handling postMessage playback event', err)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [updatePlaybackProgress])

  // Monitor document fullscreen state changes
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement || document.webkitFullscreenElement)
      setIsFullscreen(isFull)
      if (!isFull && window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock().catch(() => {})
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [])

  if (!currentPlaying) return null

  // Compute stream URL
  const streamUrl = isTv
    ? activeProvider.getTvUrl(currentPlaying.id, currentSeason, currentEpisode, effectiveStartAt)
    : activeProvider.getMovieUrl(currentPlaying.id, effectiveStartAt)

  const handleReloadIframe = () => {
    setIframeKey(Date.now())
  }

  const handleNextEpisode = () => {
    setStartAtOverride(0)
    updatePlayingEpisode(currentSeason, currentEpisode + 1)
  }

  const handlePrevEpisode = () => {
    if (currentEpisode > 1) {
      setStartAtOverride(0)
      updatePlayingEpisode(currentSeason, currentEpisode - 1)
    }
  }

  // Single dedicated Fullscreen & Landscape button
  const toggleFullscreenLandscape = async () => {
    const container = playerContainerRef.current
    if (!container) return

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen()
        }
      } catch (e) {
        console.warn('Exit fullscreen failed', e)
      }
      if (window.screen?.orientation?.unlock) {
        window.screen.orientation.unlock().catch(() => {})
      }
      setIsFullscreen(false)
    } else {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen()
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen()
        }

        // Lock screen orientation to landscape
        if (window.screen?.orientation?.lock) {
          await window.screen.orientation.lock('landscape').catch((e) => {
            console.log('Screen orientation lock not supported on this browser/platform', e)
          })
        }
        setIsFullscreen(true)
      } catch (err) {
        console.warn('Fullscreen landscape request failed:', err)
      }
    }
  }

  // Netflix-style Restart From Beginning
  const handleRestartFromBeginning = () => {
    setStartAtOverride(0)
    setShowResumeBanner(false)
    if (updatePlaybackProgress) {
      updatePlaybackProgress(0, 0)
    }
    setIframeKey(Date.now())
  }

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const s = Math.floor(sec)
    const mins = Math.floor(s / 60)
    const secs = s % 60
    const hours = Math.floor(mins / 60)
    if (hours > 0) {
      const remMins = mins % 60
      return `${hours}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const bookmarked = isBookmarked(currentPlaying.id, currentPlaying.media_type)
  const isSandboxed = Boolean(sandboxConfig.value)

  const releaseDateStr = currentPlaying.release_date || metadata?.release_date
  const isFutureRelease = releaseDateStr && new Date(releaseDateStr).getTime() > Date.now()

  return (
    <div className="relative w-full bg-slate-950 text-slate-100 min-h-screen pb-16 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
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

        {/* Right Controls */}
        <div className="flex items-center gap-2">
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

          <a
            href={streamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            title="Open stream in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={closePlayer}
            className="p-2 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 transition-colors"
            title="Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Player Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 space-y-3">
        {/* Anti-Sandbox Warning Banner if sandbox is active */}
        {isSandboxed && (
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Anti-Ad Sandbox is active:</strong> If your player displays <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">"This content can't be embedded in a sandboxed frame"</code>, turn off sandboxing to allow the provider to stream.
              </span>
            </div>
            <button
              onClick={() => updateSandboxMode('unrestricted')}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors"
            >
              Turn Off Sandbox (Allow Playback)
            </button>
          </div>
        )}

        {/* Future Release Warning */}
        {isFutureRelease && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-slate-300">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Note:</strong> "{currentPlaying.title || currentPlaying.name}" is scheduled for release on {releaseDateStr}. If the player displays "Video not found", third-party servers do not host pre-release titles until official release.
            </span>
          </div>
        )}

        {/* Server & Controls Toolbar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          {/* Server Switchers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Server className="w-3.5 h-3.5 text-rose-400" />
              Server:
            </span>
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
                    {provider.name.split(' ')[0]}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Quick Actions: Sandbox, Reload, and Single Fullscreen Landscape Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Sandbox Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSandboxDropdownOpen(!sandboxDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 hover:border-slate-600 text-slate-200 transition-colors"
                title="Configure iframe sandboxing security mode"
              >
                {sandboxMode === 'strict' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Sandbox: {sandboxConfig.name.split(' ')[0]}</span>
              </button>

              {sandboxDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                  <h4 className="text-xs font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800">
                    Iframe Sandboxing Security
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
                </div>
              )}
            </div>

            {/* Reload Stream Player */}
            <button
              onClick={handleReloadIframe}
              className="p-1.5 text-slate-300 hover:text-white bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
              title="Reload Stream Player"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* SINGLE DEDICATED FULLSCREEN LANDSCAPE BUTTON */}
            <button
              onClick={toggleFullscreenLandscape}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950/40 border border-rose-500 transition-all active:scale-95"
              title="Enter Fullscreen Landscape Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Landscape Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Embedded Iframe Player Box (100% UNOBSTRUCTED: Direct native touch & mouse interaction) */}
        <div
          ref={playerContainerRef}
          className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/80 transition-all ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 aspect-auto w-screen h-screen' : ''
          }`}
        >
          {/* Netflix-Style Resume Banner */}
          {showResumeBanner && effectiveStartAt > 15 && (
            <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-30 bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-2 duration-300 max-w-md pointer-events-auto">
              <Clock className="w-4 h-4 text-rose-500 shrink-0" />
              <div className="text-xs min-w-0">
                <span className="text-slate-300">Resumed from </span>
                <strong className="text-white font-mono">{formatSeconds(effectiveStartAt)}</strong>
              </div>
              <button
                onClick={handleRestartFromBeginning}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] whitespace-nowrap shadow transition-colors ml-auto"
              >
                Start from Beginning
              </button>
              <button
                onClick={() => setShowResumeBanner(false)}
                className="p-1 text-slate-400 hover:text-white"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Exit Fullscreen Button (Shown in Fullscreen mode) */}
          {isFullscreen && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
              <button
                onClick={toggleFullscreenLandscape}
                className="p-2 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Pure Video Iframe: NO BLOCKING OVERLAYS WHATSOEVER */}
          <iframe
            key={`${currentPlaying.id}-${currentSeason}-${currentEpisode}-${activeProvider.id}-${sandboxMode}-${iframeKey}-${effectiveStartAt}`}
            ref={iframeRef}
            src={streamUrl}
            title={currentPlaying.title || currentPlaying.name}
            className="w-full h-full border-0 transition-[filter] duration-150"
            style={{ filter: `brightness(${brightness})` }}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            referrerPolicy="origin"
            onLoad={() => {
              try {
                iframeRef.current?.contentWindow?.postMessage({ type: 'NERO_UNMUTE' }, '*')
              } catch (e) {}
            }}
            {...(sandboxConfig.value ? { sandbox: sandboxConfig.value } : {})}
          />

          {/* VLC-Style Sleek Vertical Brightness Pill (Left Edge, <= 1s) */}
          {brightnessPill && isNative && (
            <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in fade-in duration-100">
              <div className="w-6 sm:w-7 h-32 sm:h-36 bg-black/65 backdrop-blur-md border border-white/20 rounded-full p-1 flex flex-col justify-end items-center shadow-2xl relative overflow-hidden">
                <div
                  className="w-full bg-gradient-to-t from-sky-400 to-sky-300 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(6, Math.min(100, brightnessPill.percent))}%` }}
                />
                <div className="absolute bottom-2 flex items-center justify-center pointer-events-none">
                  <Sun className="w-3.5 h-3.5 text-white drop-shadow" />
                </div>
              </div>
            </div>
          )}

          {/* VLC-Style Sleek Vertical Volume Pill (Right Edge, <= 1s) */}
          {volumePill && isNative && (
            <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in fade-in duration-100">
              <div className="w-6 sm:w-7 h-32 sm:h-36 bg-black/65 backdrop-blur-md border border-white/20 rounded-full p-1 flex flex-col justify-end items-center shadow-2xl relative overflow-hidden">
                <div
                  className="w-full bg-gradient-to-t from-rose-500 to-rose-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(6, Math.min(100, volumePill.percent))}%` }}
                />
                <div className="absolute bottom-2 flex items-center justify-center pointer-events-none">
                  {volumePill.percent === 0 ? (
                    <VolumeX className="w-3.5 h-3.5 text-white/80 drop-shadow" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-white drop-shadow" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Samsung-Style 10s Rewind Pill (Left Side, <= 1s) */}
          {seekPill?.direction === 'back' && isNative && (
            <div className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-2xl font-semibold text-xs tracking-wide">
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>10s</span>
              </div>
            </div>
          )}

          {/* Samsung-Style 10s Forward Pill (Right Side, <= 1s) */}
          {seekPill?.direction === 'forward' && isNative && (
            <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-2xl font-semibold text-xs tracking-wide">
                <span>10s</span>
                <RotateCw className="w-4 h-4 text-rose-400" />
              </div>
            </div>
          )}

          {/* Samsung-Style Play/Pause Quick Indicator (Center, <= 1s) */}
          {playPausePill && isNative && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center animate-in zoom-in-90 fade-in duration-100">
              <div className="p-3.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white shadow-2xl">
                {playPausePill.action === 'play' ? (
                  <Play className="w-7 h-7 text-white fill-current translate-x-0.5" />
                ) : (
                  <Pause className="w-7 h-7 text-white fill-current" />
                )}
              </div>
            </div>
          )}
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
              onSelectEpisode={(s, e) => {
                setStartAtOverride(0)
                updatePlayingEpisode(s, e)
              }}
            />
          </div>
        )}

        {/* Metadata & Title Details */}
        <div className="mt-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-6">
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

              <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed max-w-4xl">
                {metadata?.overview || currentPlaying.overview || 'No overview provided.'}
              </p>

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
