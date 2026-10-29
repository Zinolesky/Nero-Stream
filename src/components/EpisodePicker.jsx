import React, { useState, useEffect } from 'react'
import { tmdb } from '../services/tmdb'
import { Play, Clock, Calendar, CheckCircle2, Sparkles, Layers } from 'lucide-react'

export const EpisodePicker = ({
  tvId,
  currentSeason = 1,
  currentEpisode = 1,
  onSelectEpisode,
  totalSeasons = 1,
  seasons = [],
}) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)

  // Clean, verified seasons array excluding specials (season 0) unless only specials exist
  const availableSeasons =
    seasons.length > 0
      ? seasons.filter((s) => s.season_number > 0)
      : Array.from({ length: totalSeasons || 1 }, (_, i) => ({
          season_number: i + 1,
          name: `Season ${i + 1}`,
          episode_count: 8,
        }))

  useEffect(() => {
    let isMounted = true
    const fetchEpisodes = async () => {
      setLoading(true)
      try {
        const data = await tmdb.getSeasonEpisodes(tvId, selectedSeason)
        if (isMounted) {
          setEpisodes(data.episodes || [])
        }
      } catch (e) {
        console.error('Failed to load season episodes', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    if (tvId) {
      fetchEpisodes()
    }

    return () => {
      isMounted = false
    }
  }, [tvId, selectedSeason])

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-rose-500" />
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
            Episodes & Seasons
          </h3>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30">
            {episodes.length} Episodes
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Tap any episode to jump straight into streaming
        </p>
      </div>

      {/* Modern Horizontal Season Pills (Replaces outdated Android <select> dropdown) */}
      <div className="py-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {availableSeasons.map((s) => {
            const isSelected = s.season_number === selectedSeason
            return (
              <button
                key={s.season_number}
                onClick={() => setSelectedSeason(s.season_number)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-950/60 scale-[1.02]'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span>{s.name || `Season ${s.season_number}`}</span>
                {s.episode_count && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/30 text-rose-100'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {s.episode_count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Episode Cards Grid */}
      <div className="mt-4 max-h-[500px] overflow-y-auto pr-1 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold tracking-wide">
              Loading Season {selectedSeason} episodes...
            </span>
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs sm:text-sm bg-slate-950/40 rounded-xl p-6 border border-slate-800">
            No episodes found for Season {selectedSeason}.
          </div>
        ) : (
          episodes.map((ep) => {
            const isPlaying =
              selectedSeason === currentSeason && ep.episode_number === currentEpisode
            const thumbUrl = tmdb.getImageUrl(ep.still_path, 'w300')

            return (
              <div
                key={ep.id || ep.episode_number}
                onClick={() => onSelectEpisode(selectedSeason, ep.episode_number)}
                className={`group relative flex items-start gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${
                  isPlaying
                    ? 'bg-rose-950/30 border-rose-500 shadow-lg shadow-rose-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700/90'
                }`}
              >
                {/* 16:9 Episode Thumbnail */}
                <div className="relative w-28 sm:w-40 aspect-video shrink-0 bg-slate-800 rounded-lg overflow-hidden border border-slate-700/60 shadow-md">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px] p-2 text-center">
                      <Layers className="w-4 h-4 mb-1 text-slate-600" />
                      <span>Episode {ep.episode_number}</span>
                    </div>
                  )}

                  {/* Play Action Overlay */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all ${
                      isPlaying
                        ? 'bg-rose-950/70 opacity-100'
                        : 'bg-black/50 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full shadow-lg ${
                        isPlaying
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-white/95 text-slate-950 scale-95 group-hover:scale-105'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </div>
                  </div>

                  {/* Episode Number Tag */}
                  <span className="absolute bottom-1 right-1 bg-black/85 text-[10px] text-slate-200 font-bold px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10 font-mono">
                    E{ep.episode_number}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-rose-400 font-mono">
                      EP {ep.episode_number}
                    </span>
                    <h4
                      className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                        isPlaying
                          ? 'text-rose-300'
                          : 'text-slate-100 group-hover:text-rose-400'
                      }`}
                    >
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>
                    {isPlaying && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3" /> Now Playing
                      </span>
                    )}
                  </div>

                  {ep.overview ? (
                    <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {ep.overview}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic mt-1">
                      No synopsis available for this episode.
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-[10px] sm:text-[11px] text-slate-400">
                    {ep.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {ep.runtime} min
                      </span>
                    )}
                    {ep.air_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {ep.air_date}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
