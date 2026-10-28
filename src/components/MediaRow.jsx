import React, { useRef } from 'react'
import { MediaCard } from './MediaCard'
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

export const MediaRow = ({ title, items = [], icon: Icon, onClear, emptyMessage }) => {
  const scrollContainerRef = useRef(null)

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!items || items.length === 0) {
    if (emptyMessage) {
      return (
        <div className="py-6 px-4">
          <div className="flex items-center gap-2 mb-3">
            {Icon && <Icon className="w-5 h-5 text-rose-500" />}
            <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center text-slate-500 text-sm">
            {emptyMessage}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative group/row py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-5 h-5 text-rose-500" />}
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {items.length}
          </span>
        </div>

        {onClear && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1 rounded"
            title="Clear"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Horizontal Scroll Arrows */}
      <button
        onClick={() => handleScroll('left')}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-rose-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all duration-200"
        title="Scroll left"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => handleScroll('right')}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 hover:bg-rose-600 text-white items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover/row:opacity-100 transition-all duration-200"
        title="Scroll right"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex items-start gap-4 overflow-x-auto no-scrollbar px-4 sm:px-6 pb-4 pt-1"
      >
        {items.map((item, index) => (
          <MediaCard key={`${item.id}-${item.media_type || 'movie'}-${index}`} item={item} />
        ))}
      </div>
    </div>
  )
}
