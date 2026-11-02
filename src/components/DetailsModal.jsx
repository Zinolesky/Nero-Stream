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
  Layers,
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
  const [selectedSeason, setSelectedSeason] = useState(1)

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

  // Clean list of seasons (excluding specials / season 0)
  const availableSeasons =
    details?.seasons && details.seasons.length > 0
      ? details.seasons.filter((s) => s.season_number > 0)
      : Array.from({ length: details?.number_of_seasons || item?.number_of_seasons || 1 }, (_, i) => ({
          season_number: i + 1,
          name: `Season ${i + 1}`,
          episode_count: 8,
        }))

  const handlePlayNow = () => {
    playMedia(details || item, isTv ? selectedSeason : 1, 1)
    closeModal()
  }

  const handlePlaySeason = (seasonNumber, episodeNumber = 1) => {
    playMedia(details || item, seasonNumber, episodeNumber)
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
            <div className="hidden sm:flex items-center gap-2.5 shrink-0">
              {isTv && availableSeasons.length > 1 && (
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 backdrop-blur-md shadow-lg">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Season</span>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-transparent text-xs font-bold text-rose-400 outline-none cursor-pointer"
                  >
                    {availableSeasons.map((s) => (
                      <option key={s.season_number} value={s.season_number} className="bg-slate-900 text-white">
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handlePlayNow}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950 transition-transform hover:scale-105 active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isTv && availableSeasons.length > 1 ? `Watch Season ${selectedSeason}` : 'Watch Now'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Action Row for Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            {isTv && availableSeasons.length > 1 && (
              <div className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">Season</span>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-rose-400 outline-none cursor-pointer"
                >
                  {availableSeasons.map((s) => (
                    <option key={s.season_number} value={s.season_number} className="bg-slate-900 text-white">
                      {s.season_number}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handlePlayNow}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isTv && availableSeasons.length > 1 ? `Watch S${selectedSeason}` : 'Watch Now'}</span>
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

          {/* TV Seasons: Jump straight into any season of your choice */}
          {isTv && availableSeasons.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-rose-500" />
                    Available Seasons ({availableSeasons.length})
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click any season to jump directly into watching:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {availableSeasons.map((s) => {
                  const isCurrent = s.season_number === selectedSeason
                  return (
                    <button
                      key={s.id || s.season_number}
                      onClick={() => handlePlaySeason(s.season_number, 1)}
                      className={`group flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all duration-150 text-left active:scale-95 ${
                        isCurrent
                          ? 'bg-rose-950/70 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                          : 'bg-slate-950/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850 hover:text-white'
                      }`}
                      title={`Jump straight into ${s.name || `Season ${s.season_number}`}`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold truncate text-slate-200 group-hover:text-white">
                          {s.name || `Season ${s.season_number}`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {s.episode_count || 8} episodes
                        </p>
                      </div>
                      <div className="p-2 rounded-xl bg-rose-600 group-hover:bg-rose-500 text-white shrink-0 shadow-md transition-transform group-hover:scale-110">
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
