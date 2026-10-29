import React from 'react'
import { useApp } from '../context/AppContext'
import { tmdb } from '../services/tmdb'
import { Play, Star, Plus, Check, Info, Clock } from 'lucide-react'

export const MediaCard = ({ item }) => {
  const { playMedia, openDetails, toggleBookmark, isBookmarked } = useApp()

  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date)
  const title = item.title || item.name || 'Untitled'
  const dateStr = item.release_date || item.first_air_date
  const year = dateStr ? new Date(dateStr).getFullYear() : null
  const posterUrl = tmdb.getImageUrl(item.poster_path, 'w500')
  const bookmarked = isBookmarked(item.id, item.media_type)

  const hasProgress =
    (item.progressPercent && item.progressPercent > 0) || (item.currentTime && item.currentTime > 15)
  const remainingMins =
    item.duration && item.currentTime
      ? Math.max(1, Math.round((item.duration - item.currentTime) / 60))
      : null

  const handlePlay = (e) => {
    e.stopPropagation()
    playMedia(item, item.season || 1, item.episode || 1, item.currentTime || 0)
  }

  const handleBookmark = (e) => {
    e.stopPropagation()
    toggleBookmark(item)
  }

  const handleOpenDetails = (e) => {
    e.stopPropagation()
    openDetails(item)
  }

  // When card has progress (Continue Watching), skip details popup and jump straight into streaming!
  const handleCardClick = (e) => {
    e.stopPropagation()
    if (hasProgress) {
      playMedia(item, item.season || 1, item.episode || 1, item.currentTime || 0)
    } else {
      openDetails(item)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col shrink-0 w-36 sm:w-44 md:w-52 cursor-pointer select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-md transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-rose-950/30 group-hover:border-slate-700">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-900 text-slate-500">
            <span className="text-xs font-bold text-slate-400 line-clamp-3">{title}</span>
            <span className="text-[10px] text-slate-600 mt-2">No Poster</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-slate-200 border border-white/10 font-mono">
            {isTv ? 'TV' : 'Movie'}
          </span>
        </div>

        {item.vote_average && item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 z-10">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Netflix-style Red Progress Bar */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950/80 z-20 overflow-hidden">
            <div
              className="h-full bg-rose-600 shadow-sm shadow-rose-500 transition-all duration-300"
              style={{ width: `${Math.max(5, item.progressPercent)}%` }}
            />
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950 transition-colors"
              title={hasProgress ? `Resume at ${Math.round(item.progressPercent)}%` : 'Watch'}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{hasProgress ? 'Resume' : 'Watch'}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`p-1.5 rounded-lg border transition-colors ${
                bookmarked
                  ? 'bg-rose-950/80 border-rose-600 text-rose-400'
                  : 'bg-black/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={bookmarked ? 'Remove from My List' : 'Add to My List'}
            >
              {bookmarked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleOpenDetails}
              className="p-1.5 rounded-lg bg-black/60 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Overview & Details"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Title & Metadata below */}
      <div className="mt-2 px-1">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-rose-400 transition-colors truncate">
          {title}
        </h3>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
          <div className="flex items-center gap-2">
            {year && <span>{year}</span>}
            {item.season && (
              <span className="text-rose-400 font-mono text-[10px]">
                S{item.season}:E{item.episode || 1}
              </span>
            )}
          </div>
          {remainingMins && (
            <span className="text-[10px] text-slate-400 font-mono">
              {remainingMins}m left
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
