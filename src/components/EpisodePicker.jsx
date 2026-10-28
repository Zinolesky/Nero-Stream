import React, { useState, useEffect } from 'react'
import { tmdb } from '../services/tmdb'
import { Play, Clock, Calendar, CheckCircle } from 'lucide-react'

export const EpisodePicker = ({ tvId, currentSeason = 1, currentEpisode = 1, onSelectEpisode, totalSeasons = 1, seasons = [] }) => {
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)

  // Ensure available seasons array
  const availableSeasons = seasons.length > 0 
    ? seasons.filter((s) => s.season_number > 0)
    : Array.from({ length: totalSeasons || 1 }, (_, i) => ({
        season_number: i + 1,
        name: `Season ${i + 1}`,
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
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Episodes</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Season {selectedSeason} • {episodes.length} Episodes
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Select an episode to immediately update the embed stream</p>
        </div>

        {/* Season Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label htmlFor="season-select" className="text-xs font-medium text-slate-400 shrink-0">
            Season:
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
          >
            {availableSeasons.map((s) => (
              <option key={s.season_number} value={s.season_number}>
                {s.name || `Season ${s.season_number}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Episode Grid / List */}
      <div className="mt-4 max-h-[460px] overflow-y-auto pr-1 space-y-2.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
            <div className="w-7 h-7 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Fetching Season {selectedSeason} episode list...</span>
          </div>
        ) : episodes.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            No episode metadata found for Season {selectedSeason}.
          </div>
        ) : (
          episodes.map((ep) => {
            const isPlaying = selectedSeason === currentSeason && ep.episode_number === currentEpisode
            const thumbUrl = tmdb.getImageUrl(ep.still_path, 'w300')

            return (
              <div
                key={ep.id || ep.episode_number}
                onClick={() => onSelectEpisode(selectedSeason, ep.episode_number)}
                className={`group relative flex items-start gap-3 sm:gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                  isPlaying
                    ? 'bg-rose-950/40 border-rose-600/70 shadow-lg shadow-rose-950/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-24 sm:w-36 h-16 sm:h-20 shrink-0 bg-slate-800 rounded-lg overflow-hidden border border-slate-700/50">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={ep.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500 text-xs">
                      No Preview
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
                      isPlaying ? 'opacity-100 bg-rose-950/60' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${isPlaying ? 'bg-rose-600 text-white' : 'bg-white/90 text-slate-900'}`}>
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-slate-300 font-bold px-1.5 py-0.5 rounded">
                    E{ep.episode_number}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-rose-400">
                      EP {ep.episode_number}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-100 truncate group-hover:text-rose-300 transition-colors">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </h4>
                    {isPlaying && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> Now Playing
                      </span>
                    )}
                  </div>

                  {ep.overview && (
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {ep.overview}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                    {ep.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ep.runtime} min
                      </span>
                    )}
                    {ep.air_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
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
