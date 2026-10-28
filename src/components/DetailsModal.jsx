import React, { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { tmdb } from '../services/tmdb'
import {
  X,
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Calendar,
  Tv,
  Film,
} from 'lucide-react'

export const DetailsModal = () => {
  const {
    selectedDetailsItem,
    closeModal,
    playMedia,
    toggleBookmark,
    isBookmarked,
  } = useApp()

  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  const item = selectedDetailsItem

  useEffect(() => {
    let isMounted = true
    const fetchFullDetails = async () => {
      if (!item) return
      setLoading(true)
      try {
        const data = await tmdb.getDetails(item.media_type || (item.first_air_date ? 'tv' : 'movie'), item.id)
        if (isMounted) {
          setDetails(data)
        }
      } catch (e) {
        console.error('Failed to load item details', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchFullDetails()
    return () => {
      isMounted = false
    }
  }, [item?.id, item?.media_type])

  if (!item) return null

  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date)
  const title = item.title || item.name || 'Untitled'
  const backdropUrl = tmdb.getBackdropUrl(item.backdrop_path || details?.backdrop_path, 'original')
  const posterUrl = tmdb.getImageUrl(item.poster_path || details?.poster_path, 'w500')
  const dateStr = item.release_date || item.first_air_date || details?.release_date || details?.first_air_date
  const year = dateStr ? new Date(dateStr).getFullYear() : null
  const bookmarked = isBookmarked(item.id, item.media_type)

  const handlePlayNow = () => {
    playMedia(details || item)
    closeModal()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Backdrop Header */}
        <div className="relative h-64 sm:h-80 w-full shrink-0 bg-slate-950">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover filter brightness-75"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-rose-950/40 to-slate-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Overlay Content */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                  {isTv ? <Tv className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                  {isTv ? 'TV Series' : 'Movie'}
                </span>
                {year && <span className="text-xs font-semibold text-slate-200">{year}</span>}
                {(item.vote_average || details?.vote_average) && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                    <Star className="w-3 h-3 fill-current text-amber-400" />
                    {(item.vote_average || details?.vote_average).toFixed(1)}
                  </span>
                )}
                {details?.runtime && (
                  <span className="text-xs text-slate-300 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {details.runtime}m
                  </span>
                )}
                {details?.number_of_seasons && (
                  <span className="text-xs text-purple-300 font-semibold">
                    {details.number_of_seasons} Season{details.number_of_seasons > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                {title}
              </h1>
            </div>

            {/* Quick Play in header */}
            <button
              onClick={handlePlayNow}
              className="hidden sm:flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950 shrink-0 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Now</span>
            </button>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Action Row for Mobile */}
          <div className="flex sm:hidden items-center gap-3">
            <button
              onClick={handlePlayNow}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Watch Now</span>
            </button>
            <button
              onClick={() => toggleBookmark(item)}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200"
            >
              {bookmarked ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Genres */}
          {(details?.genres || item.genres) && (
            <div className="flex items-center gap-2 flex-wrap">
              {(details?.genres || item.genres).map((g) => (
                <span
                  key={g.id}
                  className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  {g.name}
                </span>
              ))}
              <button
                onClick={() => toggleBookmark(item)}
                className={`hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-colors ${
                  bookmarked
                    ? 'bg-rose-950/60 border-rose-600 text-rose-400'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {bookmarked ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{bookmarked ? 'In My List' : 'Add to My List'}</span>
              </button>
            </div>
          )}

          {/* Overview text */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Synopsis
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {details?.overview || item.overview || 'No synopsis available.'}
            </p>
          </div>

          {/* Cast members */}
          {details?.credits?.cast && details.credits.cast.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Top Cast
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {details.credits.cast.slice(0, 4).map((actor) => (
                  <div key={actor.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/50 border border-slate-800">
                    {actor.profile_path ? (
                      <img
                        src={tmdb.getImageUrl(actor.profile_path, 'w185')}
                        alt={actor.name}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold shrink-0">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{actor.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Seasons preview */}
          {isTv && details?.seasons && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Seasons ({details.seasons.filter((s) => s.season_number > 0).length})
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {details.seasons
                  .filter((s) => s.season_number > 0)
                  .map((s) => (
                    <span
                      key={s.id || s.season_number}
                      className="text-xs px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300"
                    >
                      {s.name} ({s.episode_count || 8} eps)
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
