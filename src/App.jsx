import React, { useState, useEffect } from 'react'
import { useApp } from './context/AppContext'
import { tmdb } from './services/tmdb'
import { Navbar } from './components/Navbar'
import { HeroBanner } from './components/HeroBanner'
import { MediaRow } from './components/MediaRow'
import { PlayerView } from './components/PlayerView'
import { SettingsModal } from './components/SettingsModal'
import { ArchitectureInfoModal } from './components/ArchitectureInfoModal'
import { DetailsModal } from './components/DetailsModal'
import { Toast } from './components/Toast'
import { Footer } from './components/Footer'
import { MediaCard } from './components/MediaCard'
import {
  TrendingUp,
  Film,
  Tv,
  History as HistoryIcon,
  Bookmark,
  Sparkles,
  Info,
  Search,
  Key,
} from 'lucide-react'

export function AppContent() {
  const {
    currentPlaying,
    activeTab,
    searchQuery,
    history,
    bookmarks,
    clearHistory,
    isDemoMode,
    openSettings,
    activeModal,
  } = useApp()

  // Data states
  const [trending, setTrending] = useState([])
  const [popularMovies, setPopularMovies] = useState([])
  const [popularTV, setPopularTV] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchFilter, setSearchFilter] = useState('all') // 'all' | 'movie' | 'tv'
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // Fetch home rows on load or when API key changes
  useEffect(() => {
    let isMounted = true
    const loadCatalog = async () => {
      setLoading(true)
      try {
        const [trendingData, moviesData, tvData] = await Promise.all([
          tmdb.getTrending('all', 'week'),
          tmdb.getPopularMovies(1),
          tmdb.getPopularTV(1),
        ])

        if (isMounted) {
          setTrending(trendingData.results || [])
          setPopularMovies(moviesData.results || [])
          setPopularTV(tvData.results || [])
        }
      } catch (e) {
        console.error('Failed to load catalog data', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadCatalog()
    return () => {
      isMounted = false
    }
  }, [isDemoMode])

  // Debounced search query handler
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await tmdb.searchMulti(searchQuery)
        setSearchResults(data.results || [])
      } catch (e) {
        console.error('Search error', e)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filtered search results
  const filteredSearch = searchResults.filter((item) => {
    if (searchFilter === 'movie') return item.media_type === 'movie'
    if (searchFilter === 'tv') return item.media_type === 'tv'
    return true
  })

  // Pick hero title
  const heroItem = trending.length > 0 ? trending[0] : null
  const trendingRemaining = trending.length > 1 ? trending.slice(1) : trending

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-600 selection:text-white">
      <Navbar />

      {/* Embedded Stream Player (Shown when user selects a title) */}
      {currentPlaying && <PlayerView />}

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Search Mode Active */}
        {searchQuery.trim().length > 0 ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-rose-500" />
                  <span>Search Results for "{searchQuery}"</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Found {filteredSearch.length} title{filteredSearch.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSearchFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    searchFilter === 'all' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({searchResults.length})
                </button>
                <button
                  onClick={() => setSearchFilter('movie')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    searchFilter === 'movie' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Movies
                </button>
                <button
                  onClick={() => setSearchFilter('tv')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    searchFilter === 'tv' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TV Series
                </button>
              </div>
            </div>

            {searching ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Searching TMDB catalog...</span>
              </div>
            ) : filteredSearch.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <p className="text-base font-semibold">No titles found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-600 mt-1">Try another title or check your search filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 pt-6">
                {filteredSearch.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex justify-center">
                    <MediaCard item={item} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Tab Content */
          <>
            {/* Demo Mode Notice Banner */}
            {isDemoMode && (
              <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-center sm:text-left">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong>Demo Catalog Active:</strong> Exploring with verified blockbuster titles. Add your free TMDB API key to unlock the live library of millions of movies & series!
                    </span>
                  </div>
                  <button
                    onClick={openSettings}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold text-[11px] transition-colors shrink-0"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Add Free TMDB Key</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: HOME */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                {/* Hero Spotlight (only when player is not actively taking full focus) */}
                {!currentPlaying && heroItem && <HeroBanner item={heroItem} />}

                <div className="max-w-7xl mx-auto space-y-4 pt-2">
                  {/* Continue Watching / History Row */}
                  {history.length > 0 && (
                    <MediaRow
                      title="Continue Watching"
                      items={history}
                      icon={HistoryIcon}
                      onClear={clearHistory}
                    />
                  )}

                  {/* My List / Bookmarks Row */}
                  {bookmarks.length > 0 && (
                    <MediaRow
                      title="My List"
                      items={bookmarks}
                      icon={Bookmark}
                    />
                  )}

                  {/* Trending Now */}
                  <MediaRow
                    title="Trending This Week"
                    items={trendingRemaining}
                    icon={TrendingUp}
                  />

                  {/* Popular Movies */}
                  <MediaRow
                    title="Popular Movies"
                    items={popularMovies}
                    icon={Film}
                  />

                  {/* Popular TV Shows */}
                  <MediaRow
                    title="Binge-Worthy TV Series"
                    items={popularTV}
                    icon={Tv}
                  />
                </div>
              </div>
            )}

            {/* TAB: MOVIES */}
            {activeTab === 'movies' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="pb-4 border-b border-slate-800">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                    <Film className="w-6 h-6 text-rose-500" />
                    <span>Movies Catalog</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Option 2 dynamic routing: Loads player via <code className="text-rose-400">/embed/movie/&#123;tmdb_id&#125;</code>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {popularMovies.map((item, idx) => (
                    <div key={`movie-${item.id}-${idx}`} className="flex justify-center">
                      <MediaCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: TV SERIES */}
            {activeTab === 'tv' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="pb-4 border-b border-slate-800">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                    <Tv className="w-6 h-6 text-purple-400" />
                    <span>TV Series Catalog</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Option 2 nested routing: Dynamically selects season & episode via <code className="text-purple-400">/embed/tv/&#123;id&#125;/&#123;season&#125;/&#123;episode&#125;</code>
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {popularTV.map((item, idx) => (
                    <div key={`tv-${item.id}-${idx}`} className="flex justify-center">
                      <MediaCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: MY LIST / BOOKMARKS */}
            {activeTab === 'bookmarks' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                    <Bookmark className="w-6 h-6 text-rose-500" />
                    <span>My Saved List</span>
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Titles you bookmarked for later viewing. Persisted locally in your browser.
                  </p>
                </div>

                {bookmarks.length === 0 ? (
                  <div className="py-24 text-center text-slate-500 space-y-2">
                    <Bookmark className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                    <p className="text-base font-semibold text-slate-400">Your list is currently empty</p>
                    <p className="text-xs">Browse titles and click the "+" button to save movies or shows here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {bookmarks.map((item, idx) => (
                      <div key={`bookmark-${item.id}-${idx}`} className="flex justify-center">
                        <MediaCard item={item} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === 'history' && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
                      <HistoryIcon className="w-6 h-6 text-rose-500" />
                      <span>Watch History</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Resume movies and TV episodes right where you left off.
                    </p>
                  </div>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition-colors"
                    >
                      Clear All History
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="py-24 text-center text-slate-500 space-y-2">
                    <HistoryIcon className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                    <p className="text-base font-semibold text-slate-400">No watch history yet</p>
                    <p className="text-xs">When you start streaming titles, they will automatically appear here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                    {history.map((item, idx) => (
                      <div key={`hist-${item.id}-${idx}`} className="flex justify-center">
                        <MediaCard item={item} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Global Modals */}
      {activeModal === 'settings' && <SettingsModal />}
      {activeModal === 'arch-info' && <ArchitectureInfoModal />}
      {activeModal === 'details' && <DetailsModal />}

      {/* Global Toast Notifications */}
      <Toast />
    </div>
  )
}

export default function App() {
  return <AppContent />
}
