/**
 * LocalStorage utility for state persistence
 */

const STORAGE_KEYS = {
  API_KEY: 'nerostream_tmdb_key',
  PROVIDER_ID: 'nerostream_provider_id',
  SANDBOX_MODE: 'nerostream_sandbox_mode',
  HISTORY: 'nerostream_watch_history',
  BOOKMARKS: 'nerostream_bookmarks',
  ACTIVE_SESSION: 'nerostream_active_session',
  LAST_ACTIVE_TIME: 'nerostream_last_active_time',
}

const LEGACY_KEYS = {
  API_KEY: 'streamvault_tmdb_key',
  PROVIDER_ID: 'streamvault_provider_id',
  SANDBOX_MODE: 'streamvault_sandbox_mode',
  HISTORY: 'streamvault_watch_history',
  BOOKMARKS: 'streamvault_bookmarks',
}

// Built-in default key ensuring universal access across mobile, web, and all devices
const DEFAULT_TMDB_API_KEY = '98a688a277f7d48c8b44b3ec48608095'

// Grace period for restoring session on accidental tab close (15 minutes)
const SESSION_EXPIRY_MS = 15 * 60 * 1000

export const storage = {
  getApiKey: () => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.API_KEY) ||
        localStorage.getItem(LEGACY_KEYS.API_KEY)
      if (stored && stored.trim().length > 10) {
        return stored.trim()
      }
      const envKey = import.meta.env.VITE_TMDB_API_KEY
      if (envKey && envKey.trim().length > 10) {
        return envKey.trim()
      }
      return DEFAULT_TMDB_API_KEY
    } catch {
      return import.meta.env.VITE_TMDB_API_KEY || DEFAULT_TMDB_API_KEY
    }
  },

  setApiKey: (key) => {
    try {
      if (key) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim())
      } else {
        localStorage.removeItem(STORAGE_KEYS.API_KEY)
      }
    } catch (e) {
      console.error('Failed to set API key in localStorage', e)
    }
  },

  getProviderId: () => {
    try {
      const stored =
        localStorage.getItem(STORAGE_KEYS.PROVIDER_ID) ||
        localStorage.getItem(LEGACY_KEYS.PROVIDER_ID)
      // Automatically migrate from legacy ad-heavy 'vidsrc-to' to clean 'vidlink'
      if (!stored || stored === 'vidsrc-to') {
        localStorage.setItem(STORAGE_KEYS.PROVIDER_ID, 'vidlink')
        return 'vidlink'
      }
      return stored
    } catch {
      return 'vidlink'
    }
  },

  setProviderId: (id) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROVIDER_ID, id)
    } catch (e) {
      console.error('Failed to set provider in localStorage', e)
    }
  },

  getSandboxMode: () => {
    try {
      const mode =
        localStorage.getItem(STORAGE_KEYS.SANDBOX_MODE) ||
        localStorage.getItem(LEGACY_KEYS.SANDBOX_MODE)
      // If mode was the previous default 'strict', migrate to 'unrestricted'
      // because embed providers block playback in sandboxed frames
      if (mode && mode !== 'strict') {
        return mode
      }
      return 'unrestricted'
    } catch {
      return 'unrestricted'
    }
  },

  setSandboxMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SANDBOX_MODE, mode)
    } catch (e) {
      console.error('Failed to set sandbox mode in localStorage', e)
    }
  },

  getHistory: () => {
    try {
      const data =
        localStorage.getItem(STORAGE_KEYS.HISTORY) ||
        localStorage.getItem(LEGACY_KEYS.HISTORY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  saveHistoryItem: (item) => {
    try {
      const history = storage.getHistory()
      const existing = history.find((h) => h.id === item.id && h.media_type === item.media_type)
      const filtered = history.filter((h) => !(h.id === item.id && h.media_type === item.media_type))
      
      const currentTime = item.currentTime ?? existing?.currentTime ?? 0
      const duration = item.duration ?? existing?.duration ?? 0
      const progressPercent = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : (existing?.progressPercent ?? 0)

      const updatedItem = {
        ...existing,
        ...item,
        currentTime,
        duration,
        progressPercent,
        last_watched_at: new Date().toISOString(),
      }

      const updated = [updatedItem, ...filtered].slice(0, 30) // keep last 30
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated))
      return updated
    } catch (e) {
      console.error('Failed to update history', e)
      return []
    }
  },

  getItemProgress: (mediaType, id) => {
    try {
      const history = storage.getHistory()
      return history.find((h) => h.id === Number(id) && h.media_type === mediaType) || null
    } catch {
      return null
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY)
    } catch (e) {
      console.error('Failed to clear history', e)
    }
  },

  getBookmarks: () => {
    try {
      const data =
        localStorage.getItem(STORAGE_KEYS.BOOKMARKS) ||
        localStorage.getItem(LEGACY_KEYS.BOOKMARKS)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  },

  toggleBookmark: (item) => {
    try {
      const bookmarks = storage.getBookmarks()
      const exists = bookmarks.some((b) => b.id === item.id && b.media_type === item.media_type)
      let updated
      if (exists) {
        updated = bookmarks.filter((b) => !(b.id === item.id && b.media_type === item.media_type))
      } else {
        updated = [{ ...item, saved_at: new Date().toISOString() }, ...bookmarks]
      }
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated))
      return { bookmarks: updated, isBookmarked: !exists }
    } catch (e) {
      console.error('Failed to toggle bookmark', e)
      return { bookmarks: [], isBookmarked: false }
    }
  },

  // Active Session Persistence (15-Minute Grace Period)
  saveActiveSession: (sessionData) => {
    try {
      if (!sessionData) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
        return
      }
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(sessionData))
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now().toString())
    } catch (e) {
      console.warn('Failed to save active session', e)
    }
  },

  updateSessionHeartbeat: () => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVE_TIME, Date.now().toString())
    } catch {}
  },

  getActiveSession: () => {
    try {
      const lastActiveStr = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVE_TIME)
      const sessionStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION)
      if (!lastActiveStr || !sessionStr) return null

      const lastActive = parseInt(lastActiveStr, 10)
      const now = Date.now()

      // If closed longer than 15 minutes, session has expired!
      if (now - lastActive > SESSION_EXPIRY_MS) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
        return null
      }

      return JSON.parse(sessionStr)
    } catch {
      return null
    }
  },

  clearActiveSession: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION)
    } catch {}
  },
}
