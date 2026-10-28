import React from 'react'
import { useApp } from '../context/AppContext'
import { tmdb } from '../services/tmdb'
import { Play, Star, Plus, Check, Info } from 'lucide-react'

export const MediaCard = ({ item }) => {
  const { playMedia, openDetails, toggleBookmark, isBookmarked } = useApp()

  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date)
  const title = item.title || item.name || 'Untitled'
  const dateStr = item.release_date || item.first_air_date
  const year = dateStr ? new Date(dateStr).getFullYear() : null
  const posterUrl = tmdb.getImageUrl(item.poster_path, 'w500')
  const bookmarked = isBookmarked(item.id, item.media_type)

  const handlePlay = (e) => {
    e.stopPropagation()
    playMedia(item)
  }

  const handleBookmark = (e) => {
    e.stopPropagation()
    toggleBookmark(item)
  }

  const handleOpenDetails = (e) => {
    e.stopPropagation()
    openDetails(item)
  }

  return (
    <div
      onClick={handleOpenDetails}
      className="group relative flex flex-col shrink-0 w-36 sm:w-44 md:w-52 cursor-pointer select-none"
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 shadow-md transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl group-hover:shadow-rose-950/20 group-hover:border-slate-700">
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
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-slate-200 border border-white/10">
            {isTv ? 'TV' : 'Movie'}
          </span>
        </div>

        {item.vote_average && item.vote_average > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-amber-300 border border-amber-500/30 z-10">
            <Star className="w-3 h-3 fill-current text-amber-400" />
            <span>{item.vote_average.toFixed(1)}</span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlay}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md shadow-rose-950 transition-colors"
              title="Play Now"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Watch</span>
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
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
          {year && <span>{year}</span>}
          {item.season && (
            <span className="text-rose-400 font-mono text-[10px]">
              S{item.season}:E{item.episode || 1}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
