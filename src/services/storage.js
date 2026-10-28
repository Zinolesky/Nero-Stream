/**
 * LocalStorage utility for state persistence
 */

const STORAGE_KEYS = {
  API_KEY: 'nerostream_tmdb_key',
  PROVIDER_ID: 'nerostream_provider_id',
  SANDBOX_MODE: 'nerostream_sandbox_mode',
  HISTORY: 'nerostream_watch_history',
  BOOKMARKS: 'nerostream_bookmarks',
}

const LEGACY_KEYS = {
  API_KEY: 'streamvault_tmdb_key',
  PROVIDER_ID: 'streamvault_provider_id',
  SANDBOX_MODE: 'streamvault_sandbox_mode',
  HISTORY: 'streamvault_watch_history',
  BOOKMARKS: 'streamvault_bookmarks',
}

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
      return ''
    } catch {
      return import.meta.env.VITE_TMDB_API_KEY || ''
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
      return (
        localStorage.getItem(STORAGE_KEYS.PROVIDER_ID) ||
        localStorage.getItem(LEGACY_KEYS.PROVIDER_ID) ||
        'vidsrc-to'
      )
    } catch {
      return 'vidsrc-to'
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
      const filtered = history.filter((h) => !(h.id === item.id && h.media_type === item.media_type))
      const updated = [
        {
          ...item,
          last_watched_at: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 30) // keep last 30
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated))
      return updated
    } catch (e) {
      console.error('Failed to update history', e)
      return []
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
}
