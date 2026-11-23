'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowUpRight, Search } from 'lucide-react'
import { StreamingCountryPicker } from './StreamingCountryPicker'
import countries from './streaming-countries.json'

const nameByCode = new Map(countries.map(({ code, name }) => [code, name]))
const offerGroups = [
  ['subscription', 'Included with subscription'],
  ['free', 'Free'],
  ['ads', 'Free with ads'],
  ['rent', 'Rent'],
  ['buy', 'Buy'],
]

const linkProviders = {
  netflix: { searchUrl: 'https://www.netflix.com/search', searchParam: 'q' },
  primeVideo: { searchUrl: 'https://www.primevideo.com/search', searchParam: 'phrase' },
  jioHotstar: { searchUrl: 'https://www.hotstar.com/in/explore', searchParam: 'search_query' },
  appleTv: { site: 'tv.apple.com' },
  youtube: { searchUrl: 'https://www.youtube.com/results', searchParam: 'search_query', searchTerms: 'YouTube Movies' },
}

function subscriptionKey(name) {
  return name === 'Netflix' ? 'netflix' : name === 'Prime Video' ? 'primeVideo' : null
}

function linkKey(type, { providerKey }) {
  if (type !== 'subscription' && (providerKey === 'netflix' || providerKey === 'primeVideo')) return undefined
  return Object.hasOwn(linkProviders, providerKey) ? providerKey : undefined
}

function getOfferLink({ offer, movie, providerKey, directUrl }) {
  if (directUrl) return { href: directUrl, action: 'Open movie' }

  const provider = linkProviders[providerKey]
  if (provider?.searchUrl) {
    const url = new URL(provider.searchUrl)
    const query = provider.searchTerms
      ? [movie.title, movie.year, provider.searchTerms].filter(Boolean).join(' ')
      : movie.title
    url.searchParams.set(provider.searchParam, query)
    return { href: url.href, action: 'Search title' }
  }

  const url = new URL('https://www.google.com/search')
  const providerTerm = provider?.site ? `site:${provider.site}` : offer.name
  url.searchParams.set('q', [movie.title, movie.year, providerTerm].filter(Boolean).join(' '))
  return { href: url.href, action: 'Search web' }
}

function ProviderOffer({ offer, movie, providerKey, directUrl }) {
  const { href, action } = getOfferLink({ offer, movie, providerKey, directUrl })
  const Icon = directUrl ? ArrowUpRight : Search

  return (
    <a
      href={href}
      aria-label={`${action} · ${offer.name}`}
      className="group flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
    >
      <span className="flex min-w-0 items-center gap-2.5 font-medium text-foreground">
        {offer.logoPath && (
          <Image src={`https://image.tmdb.org/t/p/w45${offer.logoPath}`} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-md" />
        )}
        <span className="wrap-break-word">{offer.name}</span>
      </span>
      <span className={`inline-flex shrink-0 items-center gap-1.5 ${directUrl ? 'font-semibold text-violet-800' : 'text-muted-foreground group-hover:text-violet-800'}`}>
        {action}
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      </span>
    </a>
  )
}

export function MovieWatch({ movie, region, onRegionChange }) {
  const [attempt, setAttempt] = useState(0)
  const [lookup, setLookup] = useState(null)
  const [providerLinks, setProviderLinks] = useState(null)
  const initialAvailability = region === movie.streamingRegion ? movie.streamingAvailability : null
  const country = nameByCode.get(region) ?? (region === movie.streamingRegion ? movie.streamingCountry : null)
  const requestKey = region && movie.tmdbId && !initialAvailability
    ? `${movie.tmdbId}:${region}:${attempt}`
    : null
  const result = requestKey && lookup?.key === requestKey ? lookup : null
  const availability = initialAvailability ?? result?.availability
  const checkingAvailability = Boolean(requestKey && !result)
  const offers = availability?.offers ?? {
    subscription: availability?.providers?.map((name) => ({ name, logoPath: null, providerKey: subscriptionKey(name) })),
  }
  const groups = offerGroups.filter(([type]) => offers[type]?.length)

  const hasLinkableOffer = groups.some(([type]) => offers[type].some((offer) => linkKey(type, offer)))
  const linksKey = region && movie.tmdbId && hasLinkableOffer
    ? `${movie.tmdbId}:${region}`
    : null
  const exactLinks = linksKey && providerLinks?.key === linksKey ? providerLinks.links : {}

  useEffect(() => {
    if (!requestKey) return
    const controller = new AbortController()
    const params = new URLSearchParams({ movie: String(movie.tmdbId), region })

    async function loadAvailability() {
      try {
        const response = await fetch(`/api/recommend/availability?${params}`, { signal: controller.signal })
        const availability = response.ok ? await response.json() : null
        if (!controller.signal.aborted) setLookup({ key: requestKey, availability })
      } catch {
        if (!controller.signal.aborted) setLookup({ key: requestKey, availability: null })
      }
    }

    loadAvailability()
    return () => controller.abort()
  }, [requestKey, movie.tmdbId, region])

  useEffect(() => {
    if (!linksKey) return
    const controller = new AbortController()
    const params = new URLSearchParams({ movie: String(movie.tmdbId), region })

    async function loadProviderLinks() {
      try {
        const response = await fetch(`/api/recommend/provider-links?${params}`, { signal: controller.signal })
        if (!response.ok) return
        const { links } = await response.json()
        if (!controller.signal.aborted) setProviderLinks({ key: linksKey, links })
      } catch {
        // The provider search remains usable.
      }
    }

    loadProviderLinks()
    return () => controller.abort()
  }, [linksKey, movie.tmdbId, region])

  return (
    <section aria-labelledby="streaming-availability-title" className="border-y border-border py-4 sm:py-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 id="streaming-availability-title" className="text-lg font-semibold tracking-tight">Where to watch</h2>
        <StreamingCountryPicker value={region} onChange={onRegionChange} />
      </div>

      {checkingAvailability ? (
        <p role="status" className="text-sm text-muted-foreground">Checking watch options…</p>
      ) : groups.length > 0 ? (
        <div className="space-y-4">
          {groups.map(([type, label]) => (
            <div key={type}>
              <h3 className="mb-1.5 font-mono text-xs font-medium text-muted-foreground">{label}</h3>
              <ul className="divide-y divide-border" aria-label={label}>
                {offers[type].map((offer) => (
                  <li key={offer.name}>
                    <ProviderOffer
                      offer={offer}
                      providerKey={linkKey(type, offer)}
                      movie={movie}
                      directUrl={exactLinks[linkKey(type, offer)]}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {availability
            ? `No watch options are listed for ${country || 'this country'}.`
            : region
              ? `Watch options couldn’t be verified for ${country || 'this country'}.`
              : 'Choose a country to see local watch options.'}
        </p>
      )}

      {result && !availability && (
        <button type="button" onClick={() => setAttempt((previous) => previous + 1)} className="mt-2 min-h-11 cursor-pointer text-sm font-medium underline underline-offset-2">
          Check again
        </button>
      )}
      {availability && (
        <p className="mt-3 text-xs text-muted-foreground">
          {availability.url ? (
            <a href={availability.url} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
              Availability by JustWatch via TMDB <ArrowUpRight aria-hidden="true" className="size-3" />
            </a>
          ) : 'Availability by JustWatch via TMDB.'}
        </p>
      )}
    </section>
  )
}
