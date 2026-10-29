import React, { createContext, useContext, useState, useEffect } from 'react'
import { storage } from '../services/storage'
import { PROVIDERS, SANDBOX_MODES } from '../services/providers'
import { tmdb } from '../services/tmdb'

const AppContext = createContext(null)

export const AppProvider = ({ children }) => {
  const [apiKey, setApiKeyState] = useState(storage.getApiKey())
  const [providerId, setProviderIdState] = useState(storage.getProviderId())
  const [sandboxModeKey, setSandboxModeKeyState] = useState(storage.getSandboxMode())
  const [history, setHistory] = useState(storage.getHistory())
  const [bookmarks, setBookmarks] = useState(storage.getBookmarks())
  
  // Navigation & Playback State
  const [activeTab, setActiveTab] = useState('home') // 'home' | 'movies' | 'tv' | 'bookmarks' | 'history'
  const [currentPlaying, setCurrentPlaying] = useState(null)
  const [activeModal, setActiveModal] = useState(null) // 'settings' | 'arch-info' | 'details' | null
  const [selectedDetailsItem, setSelectedDetailsItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Toast / Notifications
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3500)
  }

  // Active Provider Object
  const activeProvider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0]

  // Active Sandbox Config
  const sandboxConfig =
    sandboxModeKey === 'unrestricted'
      ? SANDBOX_MODES.UNRESTRICTED
      : sandboxModeKey === 'moderate'
      ? SANDBOX_MODES.MODERATE
      : SANDBOX_MODES.STRICT

  const updateApiKey = (key) => {
    storage.setApiKey(key)
    setApiKeyState(key)
    if (key) {
      showToast('TMDB API Key updated successfully! Live catalog activated.', 'success')
    } else {
      showToast('Switched to Demo Mode (curated offline catalog).', 'info')
    }
  }

  const updateProviderId = (id) => {
    storage.setProviderId(id)
    setProviderIdState(id)
    const p = PROVIDERS.find((item) => item.id === id)
    if (p) {
      showToast(`Switched player stream to ${p.name}`, 'info')
    }
  }

  const updateSandboxMode = (mode) => {
    storage.setSandboxMode(mode)
    setSandboxModeKeyState(mode)
    showToast(`Sandbox security mode: ${mode.toUpperCase()}`, 'info')
  }

  const toggleBookmark = (item) => {
    const { bookmarks: updated, isBookmarked } = storage.toggleBookmark(item)
    setBookmarks(updated)
    showToast(isBookmarked ? 'Added to My List' : 'Removed from My List', 'info')
  }

  const isBookmarked = (id, mediaType) => {
    return bookmarks.some((b) => b.id === id && (b.media_type || 'movie') === (mediaType || 'movie'))
  }

  const playMedia = (item, season = 1, episode = 1, customStartAt = null) => {
    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie')
    const title = item.title || item.name || 'Untitled'

    // Check for saved progress (Netflix resume)
    const existingProgress = storage.getItemProgress(mediaType, item.id)
    const startAt =
      customStartAt !== null
        ? customStartAt
        : (existingProgress && existingProgress.currentTime > 15 && (!existingProgress.progressPercent || existingProgress.progressPercent < 95))
        ? existingProgress.currentTime
        : 0

    const playingObj = {
      id: item.id,
      media_type: mediaType,
      title,
      name: item.name,
      overview: item.overview,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      season: mediaType === 'tv' ? season : undefined,
      episode: mediaType === 'tv' ? episode : undefined,
      startAt,
      currentTime: startAt,
      duration: existingProgress?.duration || 0,
      progressPercent: existingProgress?.progressPercent || 0,
    }

    setCurrentPlaying(playingObj)

    // Save to history
    const updatedHistory = storage.saveHistoryItem(playingObj)
    setHistory(updatedHistory)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const updatePlayingEpisode = (season, episode) => {
    if (!currentPlaying || currentPlaying.media_type !== 'tv') return
    const updated = {
      ...currentPlaying,
      season,
      episode,
      startAt: 0,
      currentTime: 0,
    }
    setCurrentPlaying(updated)
    const updatedHistory = storage.saveHistoryItem(updated)
    setHistory(updatedHistory)
  }

  const updatePlaybackProgress = (currentTime, duration) => {
    if (!currentPlaying || !currentTime) return
    const updatedHistory = storage.saveHistoryItem({
      ...currentPlaying,
      currentTime,
      duration,
    })
    setHistory(updatedHistory)
  }

  const closePlayer = () => {
    setCurrentPlaying(null)
  }

  const clearHistory = () => {
    storage.clearHistory()
    setHistory([])
    showToast('Watch history cleared', 'info')
  }

  const openDetails = (item) => {
    setSelectedDetailsItem(item)
    setActiveModal('details')
  }

  const openSettings = () => setActiveModal('settings')
  const openArchInfo = () => setActiveModal('arch-info')
  const closeModal = () => {
    setActiveModal(null)
    setSelectedDetailsItem(null)
  }

  return (
    <AppContext.Provider
      value={{
        apiKey,
        updateApiKey,
        isDemoMode: !tmdb.hasKey(),
        providerId,
        updateProviderId,
        activeProvider,
        sandboxMode: sandboxModeKey,
        sandboxConfig,
        updateSandboxMode,
        history,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        clearHistory,
        currentPlaying,
        playMedia,
        updatePlayingEpisode,
        updatePlaybackProgress,
        closePlayer,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        activeModal,
        openSettings,
        openArchInfo,
        openDetails,
        closeModal,
        selectedDetailsItem,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
