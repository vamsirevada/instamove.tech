import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { limitRecommendation } from './rate-limit'
import { fetchTmdb, getMovieDetails, getStreamingAvailability, isMovieId, isStreamingRegion, movieFromDetails, services } from './tmdb'

const openai = process.env.OPENAI_API_KEY && process.env.RECOMMEND_CATALOG_ONLY !== '1'
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 0 })
  : null
const configuredTimeout = Number(process.env.RECOMMEND_AI_TIMEOUT_MS)
const aiTimeoutMs = Number.isSafeInteger(configuredTimeout) && configuredTimeout > 0
  ? Math.min(configuredTimeout, 15000)
  : 4500

const recommendationTimeoutMs = 7000
const optionalLookupTimeoutMs = 1800
const maxRecentMovies = 50
const maxCatalogPages = 4
const maxCatalogChecks = 20

const genreIds = new Map([
  ['Action', 28], ['Sci-Fi', 878], ['Comedy', 35], ['Drama', 18],
  ['Horror', 27], ['Romance', 10749], ['Thriller', 53], ['Documentary', 99],
])
const languageCodes = new Map([
  ['English', 'en'], ['Hindi', 'hi'], ['Telugu', 'te'], ['Tamil', 'ta'],
  ['Malayalam', 'ml'], ['Kannada', 'kn'], ['Spanish', 'es'], ['French', 'fr'],
  ['Korean', 'ko'], ['Japanese', 'ja'], ['Mandarin', 'zh'], ['Cantonese', 'cn'],
  ['German', 'de'], ['Italian', 'it'], ['Portuguese', 'pt'], ['Arabic', 'ar'],
  ['Turkish', 'tr'], ['Bengali', 'bn'], ['Indonesian', 'id'], ['Thai', 'th'],
])

function getReleaseYear(value) {
  return /^\d{4}$/.test(value) ? Number(value) : null
}

function isReleased(date, today) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) return false
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date
}

// Enforce the deadline even if an upstream cache or response body ignores abort.
async function waitForLookup(signal, lookup) {
  signal.throwIfAborted()
  let rejectOnAbort
  const aborted = new Promise((_, reject) => {
    rejectOnAbort = () => reject(signal.reason)
    signal.addEventListener('abort', rejectOnAbort, { once: true })
  })
  try {
    return await Promise.race([aborted, Promise.resolve().then(lookup)])
  } finally {
    signal.removeEventListener('abort', rejectOnAbort)
  }
}

async function findMovie(title, year, today, signal) {
  const data = await fetchTmdb('search/movie', { query: title, year }, { signal })
  return data.results?.find((movie) => {
    const matchingTitle = [movie.title, movie.original_title].some(
      (name) => name?.localeCompare(title, undefined, { sensitivity: 'base', ignorePunctuation: true }) === 0
    )
    return matchingTitle && isReleased(movie.release_date, today) && getReleaseYear(movie.release_date.slice(0, 4)) === year
  })
}

async function findCatalogCandidates({ service, region, genre, language, classicPick, excludedMovieIds, short, today }, signal) {
  const params = {
    ...(service && {
      watch_region: region,
      with_watch_providers: service.ids.join('|'),
      with_watch_monetization_types: 'flatrate',
    }),
    ...(short && { 'with_runtime.lte': 90 }),
    sort_by: 'popularity.desc',
    include_adult: false,
    'primary_release_date.lte': classicPick ? '1999-12-31' : today,
    ...(!classicPick && { 'primary_release_date.gte': '2000-01-01' }),
  }
  if (genreIds.has(genre)) params.with_genres = genreIds.get(genre)
  if (genre === 'Indie') params.with_keywords = 10183
  if (languageCodes.has(language)) params.with_original_language = languageCodes.get(language)

  let lookupFailed = false
  let checksRemaining = maxCatalogChecks
  for (let page = 1; page <= maxCatalogPages && checksRemaining > 0; page++) {
    signal.throwIfAborted()
    const { results = [], total_pages: totalPages } = await fetchTmdb(
      'discover/movie', { ...params, page }, { revalidate: 120, signal }
    )
    const candidates = results.filter((movie) => {
      return !excludedMovieIds.has(movie.id) && isReleased(movie.release_date, today) &&
        (movie.release_date < '2000-01-01') === classicPick
    })
    if (!service && !short && candidates.length) {
      return candidates.map((movie) => ({ movie }))
    }
    const candidatesToCheck = candidates.slice(0, checksRemaining)
    checksRemaining -= candidatesToCheck.length
    for (let offset = 0; offset < candidatesToCheck.length; offset += 5) {
      signal.throwIfAborted()
      const batch = await Promise.allSettled(
        candidatesToCheck.slice(offset, offset + 5).map(async (movie) => {
          const [details, availability] = await Promise.all([
            short ? getMovieDetails(movie.id, signal) : null,
            service ? getStreamingAvailability(movie.id, region, signal) : null,
          ])
          if (short && (!Number.isInteger(details.runtime) || details.runtime <= 0 || details.runtime > 90)) return null
          if (service && !availability.providers.includes(service.name)) return null
          return { movie, details, availability }
        })
      )
      const matches = batch.flatMap((result) =>
        result.status === 'fulfilled' && result.value ? [result.value] : []
      )
      if (matches.length) return matches
      lookupFailed ||= batch.some((result) => result.status === 'rejected')
      if (batch.every((result) => result.status === 'rejected')) throw new Error('TMDB catalog lookup failed')
    }
    if (!results.length || page >= totalPages) break
  }
  if (lookupFailed) throw new Error('TMDB catalog lookup failed')
  return []
}

async function pickWithAi({ catalog, genre, mood, language, classicPick, excludedMovieIds, today }, recommendationSignal) {
  const useCatalog = catalog.length > 0
  // Random personas for diverse recommendations
  const personas = [
    'a film festival programmer looking for hidden gems',
    'a genre specialist looking for cult classics',
    'a mainstream critic looking for highly-rated but overlooked hits',
    'a visual arts student looking for stunning cinematography',
    'a screenwriter looking for brilliant dialogue',
  ]
  const selectedPersona =
    personas[Math.floor(Math.random() * personas.length)]

  // Random seed for variety
  const randomSeed = Math.random().toString(36).substring(7)

  const prompt = `Act as ${selectedPersona}.
Recommend a single unique movie based on the following preferences.
The movie's original release year must be ${classicPick ? 'before 2000' : '2000 or later'}.
Only suggest a film that was released on or before ${today} and whose original release year you know. Keep its actual release year even if a restoration or re-release came later.

CRITICAL: DIVERSIFY YOUR SUGGESTIONS.
- Do NOT suggest "Parasite", "Inception", "The Godfather", "Interstellar", or "The Shawshank Redemption" unless specifically requested.
${excludedMovieIds.size ? `- Exclude these recently recommended TMDB movie IDs: ${[...excludedMovieIds].join(', ')}.` : ''}
- If the inputs are generic, favor "Great but less obvious" movies over "The most famous movie of all time".
- Keep the selection reason about the film. Leave out claims about where it streams.
- Consider films from a range of countries and respect the original language preference.

User Preferences:
Genre: ${genre || 'Any (Surprise me)'}
Mood: ${mood || 'Any'}
Preferred Language: ${language || 'Any'}
Request ID: ${randomSeed}
${useCatalog ? `Pick only from these catalog movies and return the matching numeric tmdbId:
${JSON.stringify(catalog.map(({ movie }) => ({
  id: movie.id, title: movie.title, year: movie.release_date.slice(0, 4), overview: movie.overview,
})))}
Use the mood and other preferences to choose among them.` : ''}

Provide a detailed response in JSON format with the following structure:
{
  ${useCatalog ? '"tmdbId": 123,\n  ' : ''}"title": "Movie Title",
  "year": "Release Year",
  "director": "Director Name",
  "genre": ["Genre1", "Genre2"],
  "rating": "IMDB or Rotten Tomatoes score",
  "synopsis": "Brief plot summary",
  "reasoning": "Why this movie fits the user request (be specific, not generic)",
  "posterDescription": "Concise visual description of the movie's official poster",
  "runtime": "e.g. 1h 45m",
  "language": "Language of the movie"
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`

  const signal = AbortSignal.any([recommendationSignal, AbortSignal.timeout(aiTimeoutMs)])
  for (let attempt = 0; attempt < (useCatalog ? 1 : 3); attempt++) {
    if (signal.aborted) break
    const completion = await openai.chat.completions.create({
      model: 'gpt-6-luna',
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable film curator with expertise in cinema from around the world. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }, { signal, timeout: aiTimeoutMs })

    const content = completion.choices[0]?.message.content
    if (!content || signal.aborted) break

    const candidate = JSON.parse(content)
    if (useCatalog) {
      const selected = catalog.find(({ movie }) => movie.id === Number(candidate?.tmdbId))
      return selected ? { ...selected, recommendation: candidate } : null
    }
    const year = getReleaseYear(candidate?.year)
    if (
      typeof candidate?.title !== 'string' ||
      !candidate.title.trim() ||
      year === null ||
      (year < 2000) !== classicPick
    ) {
      continue
    }

    const movie = await findMovie(candidate.title, year, today, signal)
    if (!signal.aborted && movie && !excludedMovieIds.has(movie.id)) {
      return { movie, recommendation: candidate }
    }
  }

  return null
}

export async function POST(request) {
  let quota
  try {
    quota = await limitRecommendation(request)
  } catch {
    return NextResponse.json({ error: 'Recommendations are temporarily unavailable. Try again shortly.' }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  function json(body, status = 200, headers = {}) {
    return NextResponse.json(body, { status, headers: { ...quota.headers, ...headers } })
  }

  if (!quota.allowed) {
    return json(
      { error: `You’ve reached the recommendation limit. Try again in ${quota.retryAfter}s.` },
      429,
      { 'Retry-After': String(quota.retryAfter) }
    )
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Send valid movie preferences.' }, 400)
  }

  const deadline = AbortSignal.timeout(recommendationTimeoutMs)
  const signal = AbortSignal.any([deadline, request.signal])
  try {
    return await waitForLookup(signal, () => recommend(body, json, signal))
  } catch (error) {
    if (deadline.aborted) {
      return json({ error: 'The movie catalog is taking too long. Try again.' }, 504)
    }
    console.warn('Recommendation catalog lookup failed', error.cause?.code || error.message)
    return json(
      { error: 'Couldn’t get a movie recommendation right now. Try again shortly.' },
      503
    )
  }
}

async function recommend(body, json, signal) {
  const { genre, mood, language, platform, includeClassics, previousReleaseYear, previousMovieId, recentMovieIds, short = false, region = 'IN' } = body
  if (region !== '' && !isStreamingRegion(region)) {
    return json({ error: 'Choose a valid streaming country.' }, 400)
  }
  const country = region ? new Intl.DisplayNames(['en'], { type: 'region' }).of(region) : null
  const service = services.find(({ name }) =>
    name === (platform === 'Amazon Prime' ? 'Prime Video' : platform)
  )
  if (platform && !service) {
    return json(
      { error: 'Choose Netflix or Prime Video to filter by a streaming service.' },
      400
    )
  }
  if (service && !region) {
    return json(
      { error: 'Choose a country to filter by streaming service.' },
      400
    )
  }
  const previousYear = getReleaseYear(previousReleaseYear)
  const classicPick =
    includeClassics === true && (previousYear === null || previousYear >= 2000)

  const excludedMovieIds = new Set(
    (Array.isArray(recentMovieIds) ? recentMovieIds.slice(-maxRecentMovies) : [])
      .concat(previousMovieId)
      .filter((id) => (typeof id === 'number' || typeof id === 'string') && isMovieId(String(id)))
      .map(Number)
  )
  const today = new Date().toISOString().slice(0, 10)
  const filters = { service, region, genre, language, classicPick, excludedMovieIds, short: short === true, today }
  let catalog
  if (service || short === true || !openai) {
    catalog = await findCatalogCandidates(filters, signal)
  }

  let pick
  if (openai && (!catalog || catalog.length)) {
    try {
      pick = await pickWithAi({ catalog: catalog ?? [], genre, mood, language, classicPick, excludedMovieIds, today }, signal)
    } catch (error) {
      signal.throwIfAborted()
      console.warn('Using the movie catalog after an AI or title lookup error', error.code || error.name)
    }
  }

  const source = pick ? 'ai' : 'catalog'
  if (!pick) {
    catalog ??= await findCatalogCandidates(filters, signal)
    pick = catalog[Math.floor(Math.random() * catalog.length)]
  }
  if (!pick) {
    return json({
      message: `No ${excludedMovieIds.size ? 'new ' : ''}${classicPick ? 'pre-2000 ' : ''}movies${short === true ? ' of 90 minutes or less' : ''} matched your filters${service ? ` on ${service.name} for ${country}` : ''}. Try changing your preferences.`,
    }, 404)
  }

  const { movie, recommendation = {} } = pick
  let { details, availability } = pick

  const optionalSignal = AbortSignal.any([signal, AbortSignal.timeout(optionalLookupTimeoutMs)])
  const [catalogDetails, listing] = await Promise.allSettled([
    details ?? waitForLookup(optionalSignal, () => getMovieDetails(movie.id, optionalSignal)),
    region && !availability
      ? waitForLookup(optionalSignal, () => getStreamingAvailability(movie.id, region, optionalSignal))
      : availability,
  ])
  if (catalogDetails.status === 'fulfilled') details = catalogDetails.value
  if (listing.status === 'fulfilled') availability = listing.value
  const verified = details ? movieFromDetails(details) : null

  return json({
    movie: {
      id: movie.id,
      tmdbId: movie.id,
      recommendationSource: source,
      title: movie.title,
      overview: movie.overview || recommendation.synopsis,
      posterPath: movie.poster_path ?? null,
      backdropPath: movie.backdrop_path ?? null,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average ?? null,
      trailerKey: verified?.trailerKey ?? null,
      director: verified?.director ?? recommendation.director,
      genres: verified?.genres ?? recommendation.genre,
      aiRating: recommendation.rating,
      aiReasoning: recommendation.reasoning,
      streamingAvailability: availability,
      streamingCountry: country,
      streamingRegion: region,
      runtime: verified?.runtime ?? recommendation.runtime,
      language: verified?.language ?? recommendation.language,
      year: movie.release_date.slice(0, 4),
    },
  })
}
