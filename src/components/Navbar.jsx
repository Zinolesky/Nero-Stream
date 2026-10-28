import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Film,
  Tv,
  Search,
  Settings,
  Bookmark,
  History,
  Layers,
  Sparkles,
  Menu,
  X,
  Play,
} from 'lucide-react'

export const Navbar = () => {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    openSettings,
    openArchInfo,
    isDemoMode,
    bookmarks,
    history,
    closePlayer,
  } = useApp()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (tab) => {
    setActiveTab(tab)
    closePlayer()
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <nav className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-600/30 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-current translate-x-0.5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-rose-400 transition-colors">
                Stream<span className="text-rose-500">Vault</span>
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-widest text-slate-400 font-semibold leading-none">
                Aggregator UI
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 text-sm font-semibold text-slate-300">
            <button
              onClick={() => handleNavClick('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'home'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'movies'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movies
            </button>
            <button
              onClick={() => handleNavClick('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'tv'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              TV Series
            </button>
            <button
              onClick={() => handleNavClick('bookmarks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors relative ${
                activeTab === 'bookmarks'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              My List
              {bookmarks.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                  {bookmarks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleNavClick('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'history'
                  ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                  : 'hover:text-white hover:bg-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xs relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search movies, TV shows..."
              className="w-full bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-full pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Architecture + Settings */}
          <div className="flex items-center gap-2">
            {/* Architecture Info Button */}
            <button
              onClick={openArchInfo}
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
              title="View Option 2 Embed Architecture"
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>Architecture</span>
            </button>

            {/* Settings & API Key Button */}
            <button
              onClick={openSettings}
              className="relative flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all shadow-sm"
              title="Configure TMDB API Key and Server Defaults"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Settings</span>
              {/* Status Indicator */}
              <span
                className={`w-2 h-2 rounded-full ${
                  isDemoMode ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                }`}
                title={isDemoMode ? 'Demo Mode (Offline Catalog)' : 'Live TMDB API Active'}
              />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-3 pb-5 space-y-3">
          {/* Mobile Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search titles..."
              className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => handleNavClick('home')}
              className={`p-2 rounded-lg text-left ${activeTab === 'home' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-300'}`}
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('movies')}
              className={`p-2 rounded-lg text-left flex items-center gap-1.5 ${activeTab === 'movies' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-300'}`}
            >
              <Film className="w-3.5 h-3.5" /> Movies
            </button>
            <button
              onClick={() => handleNavClick('tv')}
              className={`p-2 rounded-lg text-left flex items-center gap-1.5 ${activeTab === 'tv' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-300'}`}
            >
              <Tv className="w-3.5 h-3.5" /> TV Shows
            </button>
            <button
              onClick={() => handleNavClick('bookmarks')}
              className={`p-2 rounded-lg text-left flex items-center gap-1.5 ${activeTab === 'bookmarks' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-300'}`}
            >
              <Bookmark className="w-3.5 h-3.5" /> My List ({bookmarks.length})
            </button>
            <button
              onClick={() => handleNavClick('history')}
              className={`p-2 rounded-lg text-left flex items-center gap-1.5 ${activeTab === 'history' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-300'}`}
            >
              <History className="w-3.5 h-3.5" /> History ({history.length})
            </button>
            <button
              onClick={() => {
                openArchInfo()
                setMobileMenuOpen(false)
              }}
              className="p-2 rounded-lg text-left flex items-center gap-1.5 bg-slate-900 text-slate-300"
            >
              <Layers className="w-3.5 h-3.5 text-rose-400" /> Architecture
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
