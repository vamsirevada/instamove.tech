import { getStreamingAvailability, services } from './tmdb'

// These title pages have been checked against the providers' own listings.
const confirmedTitles = {
  '19995': { jioHotstar: { IN: 'https://www.hotstar.com/in/movies/avatar/1770000948' } }, // Avatar
  '940721': { // Godzilla Minus One
    netflix: 'https://www.netflix.com/title/81767635',
    appleTv: { US: 'https://tv.apple.com/us/movie/godzilla-minus-one/umc.cmc.qzounrdxwxn2hx4ttma0rjj' },
  },
  '687163': { // Project Hail Mary
    primeVideo: {
      IN: 'https://www.primevideo.com/detail/0J0SQMKFG51K9S3UTU9SDEMT7D?tr=in',
      GB: 'https://www.primevideo.com/detail/0J0SQMKFG51K9S3UTU9SDEMT7D?tr=gb',
      US: 'https://www.primevideo.com/detail/0J0SQMKFG51K9S3UTU9SDEMT7D',
    },
  },
}

let activeQueries = 0
let retryAt = 0

function uniqueId(bindings, property, pattern) {
  const values = new Set(bindings.flatMap((row) => row[property]?.value ? [row[property].value] : []))
  if (values.size !== 1) return null
  const [id] = values
  return pattern.test(id) ? id : null
}

async function queryWikidata(movieId) {
  if (activeQueries >= 3 || Date.now() < retryAt) return null

  const query = `SELECT DISTINCT ?movie ?netflix ?primeGti ?primeUs ?hotstar ?appleTv WHERE {
    ?movie wdt:P4947 "${movieId}" .
    OPTIONAL { ?movie wdt:P1874 ?netflix }
    OPTIONAL { ?movie wdt:P14462 ?primeGti }
    OPTIONAL { ?movie wdt:P8055 ?primeUs }
    OPTIONAL { ?movie wdt:P11049 ?hotstar }
    OPTIONAL { ?movie wdt:P9586 ?appleTv }
  } LIMIT 26`

  const url = new URL('https://query.wikidata.org/sparql')
  url.searchParams.set('query', query)
  activeQueries++
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'User-Agent': 'Instamovie/1.0 (https://www.instamove.tech/)',
      },
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 86400 },
    })
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      const seconds = Number(retryAfter)
      const delay = retryAfter !== null && Number.isFinite(seconds)
        ? seconds * 1000
        : Date.parse(retryAfter) - Date.now()
      retryAt = Date.now() + Math.max(60000, delay || 0)
    }
    if (!response.ok) return null
    const { results } = await response.json()
    const rows = results?.bindings
    if (!Array.isArray(rows) || !rows.length || rows.length > 25) return null
    const subjects = new Set(rows.map((row) => row.movie?.value))
    return subjects.size === 1 && !subjects.has(undefined) ? rows : null
  } catch {
    return null
  } finally {
    activeQueries--
  }
}

export async function getProviderLinks(movieId, region) {
  const { providers, offers = {} } = await getStreamingAvailability(movieId, region)
  const eligible = new Set(services.filter(({ name }) => providers.includes(name)).map(({ key }) => key))
  // A YouTube listing or video ID does not verify playable storefront access in a country.
  // Use the prefilled YouTube search until a specific link has been verified there.
  const confirmed = confirmedTitles[movieId]
  for (const { providerKey } of Object.values(offers).flat()) {
    if (providerKey === 'appleTv' || (providerKey === 'jioHotstar' && region === 'IN') ||
        (providerKey === 'youtube' && confirmed?.youtube?.[region])) {
      eligible.add(providerKey)
    }
  }
  const links = {}

  for (const key of eligible) {
    const entry = confirmed?.[key]
    const url = typeof entry === 'string' ? entry : entry?.[region]
    if (url) links[key] = url
  }

  const missing = [...eligible].filter((key) => key !== 'youtube' && !links[key])
  if (!missing.length) return links
  const rows = await queryWikidata(movieId)
  if (!rows) return links

  for (const key of missing) {
    if (key === 'netflix') {
      const id = uniqueId(rows, 'netflix', /^\d{6,8}$/)
      if (id) links[key] = `https://www.netflix.com/title/${id}`
    } else if (key === 'jioHotstar') {
      const id = uniqueId(rows, 'hotstar', /^\d{1,15}$/)
      if (id) links[key] = `https://hotstar.com/${id}`
    } else if (key === 'appleTv') {
      const id = uniqueId(rows, 'appleTv', /^umc\.cmc\.[a-z0-9]{22,25}$/)
      if (id) links[key] = `https://tv.apple.com/${region.toLowerCase()}/movie/${id}`
    } else {
      const id = uniqueId(rows, 'primeGti', /^amzn1\.dv\.gti\.[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i)
      const asin = region === 'US' ? uniqueId(rows, 'primeUs', /^B[0-9A-Z]{9}$/) : null
      if (id) links[key] = `https://www.primevideo.com/detail/${id}`
      else if (asin) links[key] = `https://www.amazon.com/gp/video/detail/${asin}`
    }
  }

  return links
}
