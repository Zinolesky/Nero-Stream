import React, { useState, useEffect, useRef, useCallback } from 'react'
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
  Sliders,
  FastForward,
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

  // Gesture & Playback State
  const [brightness, setBrightness] = useState(1.0) // 0.25 to 1.5
  const [volume, setVolume] = useState(100) // 0 to 100
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0) // 1.0, 1.25, 1.5, 2.0
  const [isFastForwarding, setIsFastForwarding] = useState(false) // Hold for 2x speed active
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [hudState, setHudState] = useState(null) // { type, value, label }
  const [gesturesEnabled, setGesturesEnabled] = useState(true)

  const playerContainerRef = useRef(null)
  const iframeRef = useRef(null)
  const hudTimerRef = useRef(null)
  const holdTimerRef = useRef(null)

  // Touch tracking refs
  const touchStartRef = useRef({ x: 0, y: 0, time: 0, initialBrightness: 1.0, initialVolume: 100 })
  const lastTapRef = useRef({ time: 0, x: 0, y: 0, side: null })

  const isTv = currentPlaying?.media_type === 'tv'
  const currentSeason = currentPlaying?.season || 1
  const currentEpisode = currentPlaying?.episode || 1

  // Determine starting timestamp (Netflix resume)
  const effectiveStartAt =
    startAtOverride !== null
      ? startAtOverride
      : (currentPlaying?.startAt && currentPlaying.startAt > 15 ? currentPlaying.startAt : 0)

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
        // VidLink sends { type: "PLAYER_EVENT", data: { event: "timeupdate"|"play"|"pause"|"seeked", currentTime, duration } }
        if (event.data && typeof event.data === 'object') {
          if (event.data.type === 'PLAYER_EVENT' && event.data.data) {
            const { currentTime, duration } = event.data.data
            if (typeof currentTime === 'number' && !isNaN(currentTime)) {
              setCurrentPlaybackTime(currentTime)
              if (typeof duration === 'number' && duration > 0) {
                setTotalDuration(duration)
              }
              if (updatePlaybackProgress) {
                updatePlaybackProgress(currentTime, duration || totalDuration)
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
  }, [updatePlaybackProgress, totalDuration])

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

  // Display temporary gesture HUD (Sun, Volume, Skip, Speed)
  const triggerHud = (type, value, label) => {
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current)
    setHudState({ type, value, label })
    hudTimerRef.current = setTimeout(() => {
      setHudState(null)
    }, 1200)
  }

  // Dispatch speed commands to player iframe
  const sendSpeedCommand = (rate) => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'NERO_SPEED', rate }, '*')
        iframeRef.current.contentWindow.postMessage({ type: 'SET_PLAYBACK_RATE', rate }, '*')
        iframeRef.current.contentWindow.postMessage({ event: 'setPlaybackRate', value: rate }, '*')
        iframeRef.current.contentWindow.postMessage({ api: 'setSpeed', value: rate }, '*')
      } catch (e) {
        // Silently catch cross-origin restriction
      }
    }
  }

  // Start Hold for 2x Speed
  const startFastForward = () => {
    setIsFastForwarding(true)
    sendSpeedCommand(2.0)
    if (navigator.vibrate) {
      try {
        navigator.vibrate(40)
      } catch (e) {}
    }
  }

  // Stop Hold for 2x Speed (return to base speed)
  const stopFastForward = () => {
    setIsFastForwarding(false)
    sendSpeedCommand(playbackSpeed)
    if (navigator.vibrate) {
      try {
        navigator.vibrate(20)
      } catch (e) {}
    }
  }

  // Change manual base speed (1x, 1.25x, 1.5x, 2x)
  const handleSetSpeed = (rate) => {
    setPlaybackSpeed(rate)
    sendSpeedCommand(rate)
    triggerHud('speed', rate, `${rate}x Speed`)
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

  // Quick Seek (-10s / +10s)
  const handleSeek = (deltaSeconds) => {
    const baseTime = currentPlaybackTime || effectiveStartAt || 0
    const newTime = Math.max(0, Math.floor(baseTime + deltaSeconds))
    setCurrentPlaybackTime(newTime)

    // Trigger visual HUD
    if (deltaSeconds < 0) {
      triggerHud('seek-back', null, '-10s')
    } else {
      triggerHud('seek-forward', null, '+10s')
    }

    // Notify iframe via postMessage
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'SEEK', time: newTime }, '*')
        iframeRef.current.contentWindow.postMessage({ event: 'seek', value: newTime }, '*')
        iframeRef.current.contentWindow.postMessage({ api: 'seek', value: newTime }, '*')
      } catch (e) {
        console.warn('Could not postMessage seek to iframe', e)
      }
    }

    if (updatePlaybackProgress) {
      updatePlaybackProgress(newTime, totalDuration)
    }
  }

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    triggerHud('play-pause', null, 'Play / Pause')
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage({ type: 'TOGGLE_PLAY' }, '*')
        iframeRef.current.contentWindow.postMessage({ event: 'togglePlay' }, '*')
      } catch (e) {
        console.warn('Could not postMessage toggle play to iframe', e)
      }
    }
  }

  // Netflix-style Restart From Beginning
  const handleRestartFromBeginning = () => {
    setStartAtOverride(0)
    setCurrentPlaybackTime(0)
    setShowResumeBanner(false)
    if (updatePlaybackProgress) {
      updatePlaybackProgress(0, totalDuration)
    }
    setIframeKey(Date.now())
  }

  // Gesture Touch Handlers (Double tap, vertical slide, and HOLD FOR 2X SPEED)
  const handleTouchStart = (e) => {
    if (!gesturesEnabled) return
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    const now = Date.now()

    // Classify zone: left 38%, right 38%, center 24%
    let side = 'center'
    if (x < rect.width * 0.38) side = 'left'
    else if (x > rect.width * 0.62) side = 'right'

    touchStartRef.current = {
      x,
      y,
      time: now,
      side,
      initialBrightness: brightness,
      initialVolume: volume,
    }

    // HOLD FOR 2X SPEED: Trigger if held in place for > 350ms
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      startFastForward()
    }, 350)

    // Check double-tap
    const prev = lastTapRef.current
    if (now - prev.time < 350 && Math.abs(x - prev.x) < 45 && Math.abs(y - prev.y) < 45) {
      // Cancel hold timer on second tap of a double tap
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }

      if (side === 'left') {
        // Double-tap left: Go back 10 seconds
        handleSeek(-10)
      } else if (side === 'right') {
        // Double-tap right: Skip 10 seconds
        handleSeek(10)
      } else {
        // Double-tap center: Play/Pause
        handleTogglePlay()
      }
      lastTapRef.current = { time: 0, x: 0, y: 0, side: null }
    } else {
      lastTapRef.current = { time: now, x, y, side }
    }
  }

  const handleTouchMove = (e) => {
    if (!gesturesEnabled) return
    const touch = e.touches[0]
    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = touch.clientX - rect.left
    const currentY = touch.clientY - rect.top
    const deltaX = Math.abs(currentX - touchStartRef.current.x)
    const deltaY = touchStartRef.current.y - currentY // Up is positive
    const side = touchStartRef.current.side

    // If moved by more than 10px, cancel hold timer and 2x speed
    if (deltaX > 10 || Math.abs(deltaY) > 10) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
      if (isFastForwarding) {
        stopFastForward()
      }
    }

    // Threshold to prevent minor tap jitter from sliding
    if (Math.abs(deltaY) > 8) {
      if (side === 'left') {
        // Sliding up and down on the left: Adjust Brightness (0.25 to 1.5)
        const step = deltaY / (rect.height * 0.8)
        const newBrightness = Math.min(1.5, Math.max(0.25, touchStartRef.current.initialBrightness + step))
        setBrightness(newBrightness)
        triggerHud('brightness', Math.round((newBrightness / 1.5) * 100), `${Math.round(newBrightness * 100)}%`)
      } else if (side === 'right') {
        // Sliding up and down on the right: Adjust Volume (0 to 100)
        const step = (deltaY / (rect.height * 0.8)) * 100
        const newVol = Math.min(100, Math.max(0, Math.round(touchStartRef.current.initialVolume + step)))
        setVolume(newVol)
        triggerHud('volume', newVol, `${newVol}%`)

        // Post message to iframe
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage({ type: 'SET_VOLUME', volume: newVol / 100 }, '*')
            iframeRef.current.contentWindow.postMessage({ event: 'setVolume', value: newVol / 100 }, '*')
          } catch (err) {
            // Silently ignore cross-origin restriction
          }
        }
      }
    }
  }

  const handleTouchEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (isFastForwarding) {
      stopFastForward()
    }
  }

  // Mouse handlers for desktop Hold for 2x Speed
  const handleMouseDown = () => {
    if (!gesturesEnabled) return
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current)
    holdTimerRef.current = setTimeout(() => {
      startFastForward()
    }, 350)
  }

  const handleMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
    if (isFastForwarding) {
      stopFastForward()
    }
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
            {/* Gesture Mode Pill Toggle */}
            <button
              onClick={() => setGesturesEnabled(!gesturesEnabled)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                gesturesEnabled
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={gesturesEnabled ? 'Gestures Active: Hold anywhere for 2x Speed, Swipe sides for Brightness & Volume, Double-tap to Skip 10s' : 'Gestures Disabled: Direct touch mode'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">{gesturesEnabled ? 'Gestures: ON' : 'Gestures: OFF'}</span>
            </button>

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

        {/* Embedded Iframe Player Box with Gesture Layer */}
        <div
          ref={playerContainerRef}
          className={`relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl shadow-black/80 transition-all select-none ${
            isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 aspect-auto w-screen h-screen' : ''
          }`}
        >
          {/* Netflix-Style Resume Banner */}
          {showResumeBanner && effectiveStartAt > 15 && (
            <div className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto z-30 bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-xl px-3.5 py-2 flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-2 duration-300 max-w-md">
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

          {/* HOLD FOR 2X SPEED HUD BADGE (Floating Top Center, YouTube/TikTok style) */}
          {isFastForwarding && (
            <div className="absolute top-4 inset-x-0 mx-auto w-fit z-40 bg-slate-900/95 backdrop-blur-md border border-rose-500/80 rounded-full px-5 py-2 flex items-center gap-2.5 shadow-2xl shadow-rose-950/50 animate-in zoom-in-95 duration-150">
              <FastForward className="w-5 h-5 text-rose-500 animate-pulse fill-current" />
              <span className="text-xs sm:text-sm font-extrabold text-white tracking-wider font-mono">
                2X SPEED &gt;&gt;
              </span>
            </div>
          )}

          {/* Floating Exit Fullscreen Button (Shown in Fullscreen mode) */}
          {isFullscreen && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
              <button
                onClick={() => setGesturesEnabled(!gesturesEnabled)}
                className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>{gesturesEnabled ? 'Gestures Active' : 'Direct Touch'}</span>
              </button>
              <button
                onClick={toggleFullscreenLandscape}
                className="p-2 rounded-lg bg-black/70 backdrop-blur-md text-white border border-white/20 hover:bg-black/90 transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Video Iframe with Brightness filter */}
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
            {...(sandboxConfig.value ? { sandbox: sandboxConfig.value } : {})}
          />

          {/* Transparent Gesture Controls Overlay Layer */}
          {gesturesEnabled && (
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="absolute inset-0 z-20 pointer-events-auto cursor-pointer"
              title="Hold anywhere for 2x Speed | Double tap left: -10s | Double tap right: +10s | Swipe left: Brightness | Swipe right: Volume"
            >
              {/* Subtle visual hints on sides */}
              <div className="absolute inset-y-0 left-0 w-[35%] flex items-center justify-start pl-4 pointer-events-none opacity-0 hover:opacity-10 transition-opacity">
                <RotateCcw className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-y-0 right-0 w-[35%] flex items-center justify-end pr-4 pointer-events-none opacity-0 hover:opacity-10 transition-opacity">
                <RotateCw className="w-12 h-12 text-white" />
              </div>
            </div>
          )}

          {/* Gesture Visual HUD Feedback */}
          {hudState && (
            <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center animate-in zoom-in-90 fade-in duration-150">
              {/* Speed HUD */}
              {hudState.type === 'speed' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-2xl text-white">
                  <FastForward className="w-8 h-8 text-rose-400 animate-pulse" />
                  <span className="text-sm font-mono font-bold text-rose-300">
                    {hudState.label}
                  </span>
                </div>
              )}

              {/* Brightness HUD (Left side indicator) */}
              {hudState.type === 'brightness' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-2xl text-white">
                  <Sun className="w-8 h-8 text-amber-400 animate-pulse" />
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-amber-400 transition-all duration-100"
                      style={{ width: `${Math.min(100, Math.max(0, (brightness / 1.5) * 100))}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Brightness {hudState.label}
                  </span>
                </div>
              )}

              {/* Volume HUD (Right side indicator) */}
              {hudState.type === 'volume' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-2xl text-white">
                  {volume === 0 ? (
                    <VolumeX className="w-8 h-8 text-rose-400" />
                  ) : (
                    <Volume2 className="w-8 h-8 text-rose-400 animate-pulse" />
                  )}
                  <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-rose-500 transition-all duration-100"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-300">
                    Volume {hudState.label}
                  </span>
                </div>
              )}

              {/* -10s Seek HUD */}
              {hudState.type === 'seek-back' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-5 flex flex-col items-center gap-1 shadow-2xl text-white">
                  <RotateCcw className="w-10 h-10 text-rose-500 animate-spin" />
                  <span className="text-sm font-bold font-mono text-rose-300">-10s</span>
                </div>
              )}

              {/* +10s Seek HUD */}
              {hudState.type === 'seek-forward' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-5 flex flex-col items-center gap-1 shadow-2xl text-white">
                  <RotateCw className="w-10 h-10 text-rose-500 animate-spin" />
                  <span className="text-sm font-bold font-mono text-rose-300">+10s</span>
                </div>
              )}

              {/* Play / Pause HUD */}
              {hudState.type === 'play-pause' && (
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-full p-5 shadow-2xl text-white">
                  <Play className="w-10 h-10 text-rose-500 fill-current animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Gesture & Control Buttons Bar (Desktop & Touch Friendly) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-slate-300">
          {/* Quick Seek */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Seek:</span>
            <button
              onClick={() => handleSeek(-10)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>-10s</span>
            </button>
            <button
              onClick={() => handleSeek(10)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono transition-colors"
              title="Skip forward 10 seconds"
            >
              <RotateCw className="w-3.5 h-3.5 text-rose-400" />
              <span>+10s</span>
            </button>
          </div>

          {/* Quick Speed Pills */}
          <div className="flex items-center gap-1.5">
            <FastForward className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="text-slate-400 font-medium">Speed:</span>
            {[1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSetSpeed(rate)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all border ${
                  playbackSpeed === rate && !isFastForwarding
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:text-white'
                }`}
                title={`Set playback speed to ${rate}x`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Quick Brightness Slider */}
          <div className="flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="range"
              min="0.25"
              max="1.5"
              step="0.05"
              value={brightness}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setBrightness(val)
                triggerHud('brightness', Math.round((val / 1.5) * 100), `${Math.round(val * 100)}%`)
              }}
              className="w-20 sm:w-28 accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              title={`Brightness: ${Math.round(brightness * 100)}%`}
            />
            <span className="font-mono text-[11px] text-amber-300 w-8 text-right">
              {Math.round(brightness * 100)}%
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Info className="w-3 h-3 text-rose-400" />
            <span>Hold screen for 2x Speed • Swipe left for Brightness • Double-tap sides to skip 10s.</span>
          </div>
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
