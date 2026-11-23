'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ArrowRight, ArrowUpRight, Check, Shuffle, SlidersHorizontal, Sparkles } from 'lucide-react'
import { countryCodes, useStreamingCountry } from './useStreamingCountry'
import { StreamingCountryPicker } from './StreamingCountryPicker'
import { getSubscriptionService, services } from './api/recommend/streaming-services'

const genres = ['Action', 'Sci-Fi', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Documentary', 'Indie']
const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Spanish', 'French', 'Korean', 'Japanese', 'Mandarin', 'Cantonese', 'German', 'Italian', 'Portuguese', 'Arabic', 'Turkish', 'Bengali', 'Indonesian', 'Thai']
const moods = ['Feel-good', 'Mind-bending', 'On edge', 'Slow burn']
const heroMovieId = 693134
const featuredFilms = [
  { id: 496243, title: 'Parasite', year: 2019, genre: 'Thriller', poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg' },
  { id: 940721, title: 'Godzilla Minus One', year: 2023, genre: 'Action', poster: '/2E2WTX0TJEflAged6kzErwqX1kt.jpg' },
  { id: 157336, title: 'Interstellar', year: 2014, genre: 'Sci-fi', poster: '/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg' },
]
const emptyPreferences = { genre: '', mood: '', vibe: '', language: '', platforms: [], includeClassics: false, short: false }
const controlClass = 'h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm disabled:opacity-65'
function FilterField({ label, value, onChange, options, placeholder, disabled }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-left text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={onChange} disabled={disabled} className={controlClass}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option === 'Indie' ? 'Indie / Art House' : option}</option>
        ))}
      </select>
    </label>
  )
}

function FilmStreamingBadges({ availability, featured = false }) {
  const offers = availability?.offers
  const subscriptions = offers?.subscription ?? []
  const entries = subscriptions.length ? subscriptions.slice(0, 2) : offers?.rent?.slice(0, 1) ?? []
  if (!entries.length) return null

  const rent = subscriptions.length === 0
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={rent ? 'Streaming rentals' : 'Included with subscription'}>
      {entries.map(({ name, logoPath }) => (
        <li key={name} className={`inline-flex min-w-0 items-center gap-1.5 rounded-md border px-1.5 py-1 text-[11px] font-medium leading-tight ${featured
          ? 'border-white/30 bg-black/50 text-white'
          : 'border-gray-200 bg-gray-50 text-neutral-800'}`}>
          {logoPath && (
            <Image src={`https://image.tmdb.org/t/p/w45${logoPath}`} alt="" width={14} height={14} unoptimized className="size-3.5 shrink-0 rounded-[3px]" />
          )}
          <span className="break-words">{rent ? `Rent on ${name === 'Apple TV Store' ? 'Apple TV' : name}` : name}</span>
        </li>
      ))}
    </ul>
  )
}

function Discovery({ initial = emptyPreferences, initialRegion = null }) {
  const router = useRouter()
  const [formData, setFormData] = useState(initial)
  const [filtersOpen, setFiltersOpen] = useState(Boolean(initial.genre || initial.language || initial.platforms.length || initial.includeClassics || initial.short))
  const [selectedCountry, setSelectedCountry] = useStreamingCountry(initialRegion)
  const [filmAvailability, setFilmAvailability] = useState(null)
  const availableServices = services.filter((service) => !service.region || service.region === selectedCountry)
  const selectedPlatforms = selectedCountry
    ? formData.platforms.filter((key) => availableServices.some((service) => service.key === key))
    : []
  const filterCount = [formData.genre, formData.language, formData.includeClassics, formData.short].filter(Boolean).length +
    selectedPlatforms.length
  const movieAvailability = filmAvailability?.country === selectedCountry ? filmAvailability.movies : null
  const hasStreamingBadges = Object.values(movieAvailability ?? {}).some(({ offers }) =>
    offers.subscription.length || offers.rent.length
  )

  useEffect(() => {
    if (!selectedCountry) return
    const controller = new AbortController()
    const params = new URLSearchParams({ region: selectedCountry })
    for (const id of [heroMovieId, ...featuredFilms.map(({ id }) => id)]) {
      params.append('movie', id)
    }

    async function loadFilmAvailability() {
      try {
        const response = await fetch(`/api/recommend/availability?${params}`, {
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        })
        if (!response.ok) return
        const { movies } = await response.json()
        if (!controller.signal.aborted) setFilmAvailability({ country: selectedCountry, movies })
      } catch {
        // Cards stay usable when availability cannot be verified.
      }
    }

    loadFilmAvailability()
    return () => controller.abort()
  }, [selectedCountry])

  function updateFilter(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function openResults(preferences) {
    if (selectedCountry === null) return
    const params = new URLSearchParams({
      region: selectedCountry,
      includeClassics: String(preferences.includeClassics),
    })
    if (preferences.short) params.set('short', 'true')
    for (const field of ['genre', 'mood', 'vibe', 'language']) {
      const value = preferences[field].trim()
      if (value) params.set(field, value)
    }
    for (const key of selectedPlatforms) params.append('platform', key)
    router.push(`/results?${params}`)
  }

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 pb-12 pt-5 sm:px-7 sm:pt-8 lg:px-10 lg:pt-10">
      <section aria-labelledby="discovery-title" className="grid overflow-hidden rounded-[1.5rem] border border-[#e4deee] bg-[#f5f1fc] lg:grid-cols-[1.14fr_1fr]">
        <div className="min-w-0 px-5 py-8 sm:px-9 sm:py-11 xl:px-12 xl:py-13">
          <h1 id="discovery-title" className="max-w-[12ch] text-balance text-[clamp(2.8rem,6vw,5.2rem)] font-bold leading-[0.97] tracking-[-0.065em]">
            Your next movie <span className="text-violet-700">starts here.</span>
          </h1>
          <p className="mt-4 max-w-[32ch] text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            Pick a mood, get one movie, and see where to watch it in your country.
          </p>
          <form id="movie-finder" className="@container mt-7 w-full scroll-mt-24 sm:mt-9" onSubmit={(event) => {
            event.preventDefault()
            openResults(formData)
          }}>
            <div className="grid items-center gap-1.5 rounded-[1rem] border border-[#dcd5f0] bg-white p-1.5 shadow-[0_6px_22px_-14px_#41326b55] transition-[box-shadow,border-color] focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_#ede9fe] sm:grid-cols-[minmax(0,1fr)_auto] @min-[29rem]:grid-cols-[minmax(0,1fr)_auto_auto]">
              <div className="flex min-w-0 items-center gap-2 px-3 sm:col-span-2 sm:pl-3.5 sm:pr-2 @min-[29rem]:col-span-1">
                <Sparkles aria-hidden="true" className="size-4 shrink-0 text-violet-700" />
                <label htmlFor="movie-mood" className="sr-only">Mood</label>
                <input id="movie-mood" name="mood" value={formData.mood} onChange={(event) => updateFilter('mood', event.target.value)} placeholder="A clever mystery…" className="min-h-11 w-0 flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none" />
              </div>
              <div className="min-w-0 border-t border-gray-200 pt-1 sm:pt-0 @min-[29rem]:max-w-40 @min-[29rem]:border-t-0 @min-[29rem]:border-l @min-[29rem]:pl-1">
                <StreamingCountryPicker value={selectedCountry} onChange={setSelectedCountry} inSearch />
              </div>
              <button type="submit" disabled={selectedCountry === null} className="group inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-[0.7rem] bg-violet-700 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-violet-800 active:bg-violet-900 disabled:cursor-wait disabled:opacity-70">
                Find a movie <ArrowRight aria-hidden="true" className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
              </button>
            </div>

            <div role="group" aria-label="Mood suggestions" className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
              {moods.map((mood) => (
                <button key={mood} type="button" aria-pressed={formData.vibe === mood} onClick={() => updateFilter('vibe', formData.vibe === mood ? '' : mood)} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[#ded8ec] bg-white/75 px-3 text-xs font-medium text-foreground transition-colors hover:border-violet-400 hover:bg-white aria-pressed:border-violet-700 aria-pressed:bg-violet-700 aria-pressed:text-white">
                  {formData.vibe === mood && <Check aria-hidden="true" className="size-3.5" />}
                  {mood}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#e1dcee] pt-2 text-sm text-muted-foreground">
              <button type="button" aria-expanded={filtersOpen} aria-controls="search-filters" onClick={() => setFiltersOpen(!filtersOpen)} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground aria-expanded:text-violet-700">
                <SlidersHorizontal aria-hidden="true" className="size-4" /> Filters
                {filterCount > 0 && <span className="rounded-full bg-violet-100 px-1.5 text-xs font-semibold text-violet-900">{filterCount}</span>}
              </button>
              <button type="button" onClick={() => openResults(emptyPreferences)} disabled={selectedCountry === null} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground">
                <Shuffle aria-hidden="true" className="size-4" /> Surprise me
              </button>
            </div>

            <div id="search-filters" hidden={!filtersOpen} className="mt-3 border-t border-input/75 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <FilterField label="Genre" value={formData.genre} onChange={(event) => updateFilter('genre', event.target.value)} options={genres} placeholder="Any genre" />
                <FilterField label="Language" value={formData.language} onChange={(event) => updateFilter('language', event.target.value)} options={languages} placeholder="Any language" />
                <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-left text-sm text-muted-foreground">
                  <input type="checkbox" checked={formData.includeClassics} onChange={(event) => updateFilter('includeClassics', event.target.checked)} className="size-4 accent-violet-700" />
                  Include classics
                </label>
                <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-left text-sm text-muted-foreground">
                  <input type="checkbox" checked={formData.short} onChange={(event) => updateFilter('short', event.target.checked)} className="size-4 accent-violet-700" />
                  90 minutes or less
                </label>
              </div>
              <fieldset disabled={!selectedCountry} className="mt-3 min-w-0 border-t border-input/75 pt-3 disabled:opacity-65">
                <legend className="pr-2 text-sm font-semibold">Your subscriptions</legend>
                <p className="mb-2 text-xs text-muted-foreground">
                  {selectedCountry ? 'Find movies included with any service you select.' : 'Choose a streaming country first.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableServices.map(({ name, key }) => (
                    <label key={key} className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-violet-200 bg-white px-2.5 text-xs font-medium text-foreground has-checked:border-violet-500 has-checked:bg-violet-100 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-violet-700">
                      <input type="checkbox" checked={selectedPlatforms.includes(key)} onChange={(event) => {
                        const checked = event.target.checked
                        setFormData((current) => ({
                          ...current,
                          platforms: checked ? [...current.platforms, key] : current.platforms.filter((value) => value !== key),
                        }))
                      }} className="size-3.5 accent-violet-700" />
                      {name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </form>
        </div>

        <Link href={`/movie/${heroMovieId}`} className="group relative isolate mx-3 mb-3 flex min-h-[15rem] min-w-0 items-end overflow-hidden rounded-[1.05rem] bg-[#49352e] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 sm:mx-4 sm:mb-4 sm:min-h-72 lg:ml-0 lg:mt-4">
          <Image src="https://image.tmdb.org/t/p/w1280/eZ239CUp1d6OryZEBPnO2n87gMG.jpg" alt="" fill unoptimized preload sizes="(min-width: 1024px) 44vw, 95vw" className="object-cover object-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.025]" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />
          <div className="relative flex w-full items-end justify-between gap-4 p-5 sm:p-7">
            <div className="min-w-0">
              <p className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.15em] text-white/85">Featured film</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dune: Part Two</p>
              <FilmStreamingBadges availability={movieAvailability?.[heroMovieId]} featured />
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-full border border-white/60 bg-black/20 backdrop-blur-sm transition-colors group-hover:bg-white group-hover:text-foreground">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </span>
          </div>
        </Link>
      </section>

      <section aria-labelledby="browse-films-title" className="mt-7 sm:mt-9">
        <h2 id="browse-films-title" className="mb-3 text-sm font-semibold tracking-tight sm:text-base">More films to explore</h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          {featuredFilms.map((film) => (
            <li key={film.id} className="min-w-0">
              <Link href={`/movie/${film.id}`} className="group flex h-full min-h-24 items-center gap-3 rounded-xl border border-gray-200/80 bg-white/85 p-3 transition-[background-color,border-color,box-shadow,transform] hover:border-violet-200 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-700 motion-safe:hover:-translate-y-0.5">
                <Image src={`https://image.tmdb.org/t/p/w154${film.poster}`} alt="" width={44} height={64} unoptimized className="h-16 w-11 shrink-0 rounded-md bg-muted object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{film.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{film.year} · {film.genre}</p>
                  <FilmStreamingBadges availability={movieAvailability?.[film.id]} />
                </div>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 group-hover:text-violet-800" />
              </Link>
            </li>
          ))}
        </ul>
        {hasStreamingBadges && (
          <p className="mt-3 text-xs text-muted-foreground">Availability by JustWatch via TMDB.</p>
        )}
      </section>
    </div>
  )
}

function DiscoveryFromUrl() {
  const params = useSearchParams()
  const region = params.get('region')
  const platforms = [...new Set(params.getAll('platform').map((value) => getSubscriptionService(value)?.key).filter(Boolean))]
  const mood = params.get('mood') ?? ''
  const vibe = params.get('vibe') ?? mood
  const initial = {
    genre: genres.includes(params.get('genre')) ? params.get('genre') : '',
    mood: !params.has('vibe') && moods.includes(mood) ? '' : mood,
    vibe: moods.includes(vibe) ? vibe : '',
    language: languages.includes(params.get('language')) ? params.get('language') : '',
    platforms: region === '' ? [] : platforms,
    includeClassics: params.get('includeClassics') === 'true',
    short: params.get('short') === 'true',
  }

  return <Discovery key={params.toString()} initial={initial} initialRegion={region === '' || countryCodes.has(region) ? region : null} />
}

export default function Home() {
  return (
    <Suspense fallback={<Discovery />}>
      <DiscoveryFromUrl />
    </Suspense>
  )
}
