/**
 * TMDB (The Movie Database) API Service
 * Handles metadata, search, poster images, and TV season/episode structures.
 * Includes rich offline fallback demo data when API key is not configured.
 */

import { storage } from './storage'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

// Curated demo catalog with verified TMDB IDs and real image assets
export const DEMO_DATA = {
  trending: [
    {
      id: 693134,
      media_type: 'movie',
      title: 'Dune: Part Two',
      overview: 'Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
      poster_path: '/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      backdrop_path: '/xOMo8BRK7PfcJv9JCnx7s5200SV.jpg',
      vote_average: 8.2,
      release_date: '2024-02-27',
      genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
    },
    {
      id: 106379,
      media_type: 'tv',
      name: 'Fallout',
      overview: 'In a future post-apocalyptic Los Angeles brought about by nuclear decimation, citizens must live in underground bunkers to protect themselves from radiation, mutants and bandits.',
      poster_path: '/AnsSKR99HG0ZeZ3PQCzPCjhTk3q.jpg',
      backdrop_path: '/4woSOUD0equAYzvwhWBHIJDCM88.jpg',
      vote_average: 8.3,
      first_air_date: '2024-04-10',
      number_of_seasons: 1,
      genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10759, name: 'Action & Adventure' }],
    },
    {
      id: 872585,
      media_type: 'movie',
      title: 'Oppenheimer',
      overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II and the political fallout that followed.',
      poster_path: '/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      backdrop_path: '/fm6K9vYyo0hsp2zsQhmZBDMlZ6U.jpg',
      vote_average: 8.1,
      release_date: '2023-07-19',
      genres: [{ id: 18, name: 'Drama' }, { id: 36, name: 'History' }],
    },
    {
      id: 94605,
      media_type: 'tv',
      name: 'Arcane',
      overview: 'Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.',
      poster_path: '/abf8tHg90np2zWPV78J5vC9u21.jpg',
      backdrop_path: '/fqv8v6A9pnIvUrEdWF55m5f0K3w.jpg',
      vote_average: 8.7,
      first_air_date: '2021-11-06',
      number_of_seasons: 2,
      genres: [{ id: 16, name: 'Animation' }, { id: 10765, name: 'Sci-Fi & Fantasy' }],
    },
    {
      id: 569094,
      media_type: 'movie',
      title: 'Spider-Man: Across the Spider-Verse',
      overview: 'Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.',
      poster_path: '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      backdrop_path: '/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
      vote_average: 8.4,
      release_date: '2023-05-31',
      genres: [{ id: 16, name: 'Animation' }, { id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }],
    },
    {
      id: 1396,
      media_type: 'tv',
      name: 'Breaking Bad',
      overview: 'A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student in order to secure his family\'s future.',
      poster_path: '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg',
      backdrop_path: '/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg',
      vote_average: 8.9,
      first_air_date: '2008-01-20',
      number_of_seasons: 5,
      genres: [{ id: 18, name: 'Drama' }, { id: 80, name: 'Crime' }],
    },
  ],
  popularMovies: [
    {
      id: 533535,
      media_type: 'movie',
      title: 'Deadpool & Wolverine',
      overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again.',
      poster_path: '/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
      backdrop_path: '/yDHYTfA3R0jFYba16jBB1jv82EU.jpg',
      vote_average: 7.7,
      release_date: '2024-07-24',
      genres: [{ id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }, { id: 878, name: 'Sci-Fi' }],
    },
    {
      id: 157336,
      media_type: 'movie',
      title: 'Interstellar',
      overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
      poster_path: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      backdrop_path: '/rAiYTsqBkgnKVXr8Xa6q3x0yPfF.jpg',
      vote_average: 8.4,
      release_date: '2014-11-05',
      genres: [{ id: 12, name: 'Adventure' }, { id: 18, name: 'Drama' }, { id: 878, name: 'Sci-Fi' }],
    },
    {
      id: 27205,
      media_type: 'movie',
      title: 'Inception',
      overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.',
      poster_path: '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      backdrop_path: '/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
      vote_average: 8.4,
      release_date: '2010-07-15',
      genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }],
    },
    {
      id: 155,
      media_type: 'movie',
      title: 'The Dark Knight',
      overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
      poster_path: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      backdrop_path: '/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
      vote_average: 8.5,
      release_date: '2008-07-16',
      genres: [{ id: 18, name: 'Drama' }, { id: 28, name: 'Action' }, { id: 80, name: 'Crime' }],
    },
    {
      id: 550,
      media_type: 'movie',
      title: 'Fight Club',
      overview: 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      backdrop_path: '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg',
      vote_average: 8.4,
      release_date: '1999-10-15',
      genres: [{ id: 18, name: 'Drama' }],
    },
    {
      id: 76600,
      media_type: 'movie',
      title: 'Avatar: The Way of Water',
      overview: 'Set more than a decade after the events of the first film, learn the story of the Sully family, the trouble that follows them, and the lengths they go to keep each other safe.',
      poster_path: '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
      backdrop_path: '/ovM06Pdrmqi2zpmnypPV3ggWIKM.jpg',
      vote_average: 7.7,
      release_date: '2022-12-14',
      genres: [{ id: 878, name: 'Sci-Fi' }, { id: 12, name: 'Adventure' }, { id: 28, name: 'Action' }],
    },
  ],
  popularTV: [
    {
      id: 66732,
      media_type: 'tv',
      name: 'Stranger Things',
      overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces and one strange little girl.',
      poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      backdrop_path: '/56v2KjBlU4XaOv9rVYEQypROD7P.jpg',
      vote_average: 8.6,
      first_air_date: '2016-07-15',
      number_of_seasons: 4,
      genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }, { id: 9648, name: 'Mystery' }],
    },
    {
      id: 1399,
      media_type: 'tv',
      name: 'Game of Thrones',
      overview: 'Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war while a long-forgotten evil awakens in the furthest north.',
      poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      backdrop_path: '/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg',
      vote_average: 8.4,
      first_air_date: '2011-04-17',
      number_of_seasons: 8,
      genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 18, name: 'Drama' }, { id: 10759, name: 'Action & Adventure' }],
    },
    {
      id: 100088,
      media_type: 'tv',
      name: 'The Last of Us',
      overview: 'Twenty years after modern civilization has been destroyed, Joel, a hardened survivor, is hired to smuggle Ellie, a 14-year-old girl, out of an oppressive quarantine zone.',
      poster_path: '/uKvVjHNqB5VmOrdxqAt2V7JMrRI.jpg',
      backdrop_path: '/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg',
      vote_average: 8.6,
      first_air_date: '2023-01-15',
      number_of_seasons: 1,
      genres: [{ id: 18, name: 'Drama' }, { id: 10765, name: 'Sci-Fi & Fantasy' }],
    },
    {
      id: 126308,
      media_type: 'tv',
      name: 'Shōgun',
      overview: 'When a mysterious European ship is found marooned in a nearby fishing village, Lord Yoshii Toranaga discovers secrets that could tip the scales of power and devastate his formidable enemies.',
      poster_path: '/7O4iVfOMQmdCSxhOg1WnzG1AgYT.jpg',
      backdrop_path: '/4mc04LMRaQ0fE4s2uC2b84J103.jpg',
      vote_average: 8.5,
      first_air_date: '2024-02-27',
      number_of_seasons: 1,
      genres: [{ id: 18, name: 'Drama' }, { id: 10768, name: 'War & Politics' }],
    },
    {
      id: 76479,
      media_type: 'tv',
      name: 'The Boys',
      overview: 'A fun and irreverent take on what happens when superheroes—who are as popular as celebrities, as influential as politicians, and as revered as gods—abuse their superpowers rather than use them for good.',
      poster_path: '/2ZmTMgnvgf9vdyjfXZPTumR0Uaf.jpg',
      backdrop_path: '/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
      vote_average: 8.5,
      first_air_date: '2019-07-25',
      number_of_seasons: 4,
      genres: [{ id: 10765, name: 'Sci-Fi & Fantasy' }, { id: 10759, name: 'Action & Adventure' }],
    },
  ],
}

// Helper to generate mock episodes for offline/demo TV exploration
const generateMockEpisodes = (showId, seasonNumber) => {
  const counts = { 1: 8, 2: 8, 3: 10, 4: 9, 5: 16 }
  const total = counts[seasonNumber] || 8
  const episodes = []
  for (let i = 1; i <= total; i++) {
    episodes.push({
      id: showId * 1000 + seasonNumber * 100 + i,
      episode_number: i,
      season_number: seasonNumber,
      name: `Episode ${i}`,
      overview: `Episode ${i} follows our characters as new complications arise in Season ${seasonNumber}, bringing unexpected challenges and revelations.`,
      still_path: null,
      runtime: 52,
      vote_average: 8.3,
      air_date: '2024-01-01',
    })
  }
  return episodes
}

export const tmdb = {
  hasKey: () => {
    const key = storage.getApiKey()
    return Boolean(key && key.trim().length > 10)
  },

  getImageUrl: (path, size = 'w500') => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  },

  getBackdropUrl: (path, size = 'original') => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  },

  testApiKey: async (key) => {
    if (!key || key.trim().length < 10) {
      return { valid: false, error: 'API key is too short.' }
    }
    try {
      const res = await fetch(`${TMDB_BASE_URL}/configuration?api_key=${key.trim()}`)
      const data = await res.json()
      if (res.ok && data.images) {
        return { valid: true }
      }
      return { valid: false, error: data.status_message || 'Invalid TMDB API key' }
    } catch (e) {
      return { valid: false, error: e.message || 'Network request failed' }
    }
  },

  getTrending: async (mediaType = 'all', timeWindow = 'week') => {
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      return { results: DEMO_DATA.trending }
    }
    try {
      const res = await fetch(`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${key}`)
      if (!res.ok) throw new Error('Failed to fetch trending')
      const data = await res.json()
      return data
    } catch (e) {
      console.warn('TMDB API error, falling back to demo data', e)
      return { results: DEMO_DATA.trending }
    }
  },

  getPopularMovies: async (page = 1) => {
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      return { results: DEMO_DATA.popularMovies }
    }
    try {
      const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${key}&page=${page}`)
      if (!res.ok) throw new Error('Failed to fetch popular movies')
      const data = await res.json()
      return {
        ...data,
        results: data.results.map((r) => ({ ...r, media_type: 'movie' })),
      }
    } catch (e) {
      console.warn('TMDB API error', e)
      return { results: DEMO_DATA.popularMovies }
    }
  },

  getPopularTV: async (page = 1) => {
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      return { results: DEMO_DATA.popularTV }
    }
    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${key}&page=${page}`)
      if (!res.ok) throw new Error('Failed to fetch popular TV')
      const data = await res.json()
      return {
        ...data,
        results: data.results.map((r) => ({ ...r, media_type: 'tv' })),
      }
    } catch (e) {
      console.warn('TMDB API error', e)
      return { results: DEMO_DATA.popularTV }
    }
  },

  searchMulti: async (query, page = 1) => {
    if (!query || !query.trim()) return { results: [] }
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      // Search inside demo data
      const q = query.toLowerCase()
      const allDemo = [...DEMO_DATA.trending, ...DEMO_DATA.popularMovies, ...DEMO_DATA.popularTV]
      const filtered = allDemo.filter((item) => {
        const title = (item.title || item.name || '').toLowerCase()
        const overview = (item.overview || '').toLowerCase()
        return title.includes(q) || overview.includes(q)
      })
      // Deduplicate
      const seen = new Set()
      const unique = filtered.filter((item) => {
        const idKey = `${item.media_type}_${item.id}`
        if (seen.has(idKey)) return false
        seen.add(idKey)
        return true
      })
      return { results: unique }
    }

    try {
      const res = await fetch(
        `${TMDB_BASE_URL}/search/multi?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}&include_adult=false`
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      // Filter out person results
      const filtered = (data.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      return { ...data, results: filtered }
    } catch (e) {
      console.error('TMDB search error', e)
      return { results: [] }
    }
  },

  getDetails: async (mediaType, id) => {
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      // Find from demo data
      const allDemo = [...DEMO_DATA.trending, ...DEMO_DATA.popularMovies, ...DEMO_DATA.popularTV]
      const found = allDemo.find((i) => i.id === Number(id) && i.media_type === mediaType)
      if (found) {
        return {
          ...found,
          seasons:
            mediaType === 'tv'
              ? Array.from({ length: found.number_of_seasons || 3 }, (_, idx) => ({
                  season_number: idx + 1,
                  name: `Season ${idx + 1}`,
                  episode_count: 8,
                }))
              : undefined,
        }
      }
      // Return fallback shell
      return {
        id: Number(id),
        media_type: mediaType,
        title: mediaType === 'movie' ? `Movie #${id}` : `Series #${id}`,
        name: mediaType === 'tv' ? `Series #${id}` : undefined,
        overview: 'Metadata loaded via direct TMDB ID.',
        vote_average: 8.0,
        number_of_seasons: mediaType === 'tv' ? 3 : undefined,
        seasons:
          mediaType === 'tv'
            ? [
                { season_number: 1, name: 'Season 1', episode_count: 8 },
                { season_number: 2, name: 'Season 2', episode_count: 8 },
              ]
            : undefined,
      }
    }

    try {
      const endpoint = mediaType === 'tv' ? 'tv' : 'movie'
      const res = await fetch(
        `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${key}&append_to_response=credits,recommendations,similar`
      )
      if (!res.ok) throw new Error('Failed to fetch details')
      const data = await res.json()
      return { ...data, media_type: mediaType }
    } catch (e) {
      console.error('TMDB getDetails error', e)
      return null
    }
  },

  getSeasonEpisodes: async (tvId, seasonNumber) => {
    const key = storage.getApiKey()
    if (!tmdb.hasKey()) {
      return { episodes: generateMockEpisodes(tvId, seasonNumber) }
    }
    try {
      const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${key}`)
      if (!res.ok) throw new Error('Failed to fetch season episodes')
      const data = await res.json()
      return data
    } catch (e) {
      console.error('TMDB getSeasonEpisodes error', e)
      return { episodes: generateMockEpisodes(tvId, seasonNumber) }
    }
  },
}
