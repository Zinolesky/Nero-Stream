import React from 'react'
import { useApp } from '../context/AppContext'
import { tmdb } from '../services/tmdb'
import { Play, Plus, Check, Info, Star, Sparkles } from 'lucide-react'

export const HeroBanner = ({ item }) => {
  const { playMedia, openDetails, toggleBookmark, isBookmarked } = useApp()

  if (!item) return null

  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date)
  const title = item.title || item.name
  const backdropUrl = tmdb.getBackdropUrl(item.backdrop_path, 'original')
  const dateStr = item.release_date || item.first_air_date
  const year = dateStr ? new Date(dateStr).getFullYear() : null
  const bookmarked = isBookmarked(item.id, item.media_type)

  return (
    <div className="relative w-full h-[480px] sm:h-[560px] lg:h-[620px] overflow-hidden select-none">
      {/* Backdrop Image */}
      {backdropUrl ? (
        <img
          src={backdropUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950" />
      )}

      {/* Cinematic Vignette Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent w-full md:w-3/4" />

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-end pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-rose-400" />
              Featured Spotlight
            </span>

            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/60 text-slate-300 border border-white/10 backdrop-blur-md">
              {isTv ? 'TV Series' : 'Movie'}
            </span>

            {year && <span className="text-xs text-slate-300 font-semibold">{year}</span>}

            {item.vote_average && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-black/60 border border-amber-500/30 px-2 py-0.5 rounded backdrop-blur-md">
                <Star className="w-3 h-3 fill-current text-amber-400" />
                {item.vote_average.toFixed(1)}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md leading-tight">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed drop-shadow">
            {item.overview}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => playMedia(item)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Watch Now</span>
            </button>

            <button
              onClick={() => toggleBookmark(item)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm sm:text-base border transition-colors ${
                bookmarked
                  ? 'bg-rose-950/80 border-rose-600 text-rose-400'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/80'
              }`}
            >
              {bookmarked ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              <span className="hidden sm:inline">{bookmarked ? 'In My List' : 'My List'}</span>
            </button>

            <button
              onClick={() => openDetails(item)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm sm:text-base transition-colors"
            >
              <Info className="w-5 h-5 text-slate-400" />
              <span className="hidden sm:inline">Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
