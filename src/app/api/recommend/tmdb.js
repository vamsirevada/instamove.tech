import { services } from './streaming-services'

export async function fetchTmdb(path, params = {}, { revalidate, signal } = {}) {
  const query = new URLSearchParams({ ...params, api_key: process.env.TMDB_API_KEY })
  const request = () => {
    const timeout = AbortSignal.timeout(6000)
    return fetch(`https://api.themoviedb.org/3/${path}?${query}`, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      ...(revalidate ? { next: { revalidate } } : { cache: 'no-store' }),
    })
  }
  let response
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted()
    try {
      response = await request()
      break
    } catch (error) {
      if (error.cause?.code !== 'ECONNRESET' || attempt === 2 || signal?.aborted) throw error
      await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)))
    }
  }
  if (!response.ok) throw Object.assign(new Error(`TMDB returned HTTP ${response.status}`), { status: response.status })
  return response.json()
}

const offerTypes = {
  subscription: 'flatrate',
  free: 'free',
  ads: 'ads',
  rent: 'rent',
  buy: 'buy',
}

function getProviderKey(providerId, name, region) {
  if (/^apple tv(?: store| plus|\+)?$/i.test(name)) return 'appleTv'
  if (/^youtube(?: movies(?: & tv)?| free)?$/i.test(name)) return 'youtube'
  if (region === 'IN' && /^jio\s*hotstar$/i.test(name)) return 'jioHotstar'
  return services.find((service) => (!service.region || service.region === region) && service.ids.includes(providerId))?.key
}

function getOffers(entries = [], region) {
  const offers = new Map()
  for (const entry of entries) {
    const name = entry.provider_name?.trim()
    if (!name) continue

    const displayName = entry.provider_id === 9 || entry.provider_id === 119 ? 'Prime Video' : name
    const logoPath = /^\/[\w-]+\.(png|jpe?g|webp)$/i.test(entry.logo_path) ? entry.logo_path : null
    const providerKey = getProviderKey(entry.provider_id, name, region)
    if (!offers.has(displayName)) offers.set(displayName, { name: displayName, logoPath, providerKey })
  }
  return [...offers.values()]
}

export async function getStreamingAvailability(movieId, region, signal) {
  const data = await fetchTmdb(`movie/${movieId}/watch/providers`, {}, { revalidate: 300, signal })
  const listing = data.results?.[region]
  const subscriptions = new Set(listing?.flatrate?.map((provider) => provider.provider_id))
  return {
    providers: services
      .filter((service) => (!service.region || service.region === region) && service.ids.some((id) => subscriptions.has(id)))
      .map(({ name }) => name),
    offers: Object.fromEntries(
      Object.entries(offerTypes).map(([type, key]) => [type, getOffers(listing?.[key], region)])
    ),
    url: listing?.link?.startsWith('https://www.themoviedb.org/') ? listing.link : null,
  }
}

export function isMovieId(value) {
  return typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2147483647
}

export function isStreamingRegion(region) {
  return typeof region === 'string' && /^[A-Z]{2}$/.test(region)
}

export function getMovieDetails(movieId, signal) {
  return fetchTmdb(`movie/${movieId}`, { append_to_response: 'credits,videos' }, { revalidate: 3600, signal })
}

export function formatRuntime(minutes) {
  if (!Number.isInteger(minutes) || minutes <= 0) return null
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return [hours && `${hours}h`, remainder && `${remainder}m`].filter(Boolean).join(' ')
}

export function movieFromDetails(details) {
  return {
    id: details.id,
    tmdbId: details.id,
    title: details.title,
    overview: details.overview,
    posterPath: details.poster_path,
    releaseDate: details.release_date,
    year: details.release_date?.slice(0, 4),
    voteAverage: details.vote_average,
    runtime: formatRuntime(details.runtime),
    genres: details.genres?.map(({ name }) => name),
    director: details.credits?.crew?.find(({ job }) => job === 'Director')?.name,
    language: details.spoken_languages?.find(({ iso_639_1 }) => iso_639_1 === details.original_language)?.english_name,
    trailerKey: details.videos?.results?.find(
      ({ site, type, key }) => site === 'YouTube' && type === 'Trailer' && /^[\w-]+$/.test(key)
    )?.key ?? null,
  }
}
