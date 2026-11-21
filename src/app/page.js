'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ArrowRight, Shuffle, SlidersHorizontal, Sparkles } from 'lucide-react'
import { countryCodes, useStreamingCountry } from './useStreamingCountry'
import { StreamingCountryPicker } from './StreamingCountryPicker'

const genres = ['Action', 'Sci-Fi', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller', 'Documentary', 'Indie']
const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Kannada', 'Spanish', 'French', 'Korean', 'Japanese', 'Mandarin', 'Cantonese', 'German', 'Italian', 'Portuguese', 'Arabic', 'Turkish', 'Bengali', 'Indonesian', 'Thai']
const platforms = ['Netflix', 'Amazon Prime']
const moods = ['Feel-good', 'Mind-bending', 'On edge', 'Slow burn']
const emptyPreferences = { genre: '', mood: '', language: '', platform: '', includeClassics: false, short: false }
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

function Discovery({ initial = emptyPreferences, initialRegion = null }) {
  const router = useRouter()
  const [formData, setFormData] = useState(initial)
  const [filtersOpen, setFiltersOpen] = useState(Boolean(initial.genre || initial.language || initial.platform || initial.includeClassics || initial.short))
  const filterCount = [formData.genre, formData.language, formData.platform, formData.includeClassics, formData.short].filter(Boolean).length

  const [selectedCountry, setSelectedCountry] = useStreamingCountry(initialRegion)

  function changeCountry(nextCountry) {
    setSelectedCountry(nextCountry)
    if (!nextCountry) updateFilter('platform', '')
  }

  function updateFilter(field, value) {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  function openResults(preferences) {
    const params = new URLSearchParams({
      region: selectedCountry,
      includeClassics: String(preferences.includeClassics),
    })
    if (preferences.short) params.set('short', 'true')
    for (const field of ['genre', 'mood', 'language', 'platform']) {
      const value = preferences[field].trim()
      if (value && (field !== 'platform' || selectedCountry)) params.set(field, value)
    }
    router.push(`/results?${params}`)
  }

  return (
    <section className="relative isolate flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center px-4 py-16 text-center sm:px-8 sm:py-20" aria-labelledby="discovery-title">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-3/4 bg-[radial-gradient(ellipse_at_50%_33%,#e6e1ff80,transparent_67%)]" />

      <h1 id="discovery-title" className="max-w-5xl text-balance text-[clamp(2.75rem,7vw,6.25rem)] leading-[0.99] font-extrabold tracking-[-0.052em]">
        Find your next <span className="bg-linear-to-r from-violet-700 to-indigo-600 bg-clip-text text-transparent">masterpiece.</span>
      </h1>
      <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
        Tell us your mood. Get one movie for tonight and see where it streams.
      </p>

      <form id="movie-finder" className="mt-8 w-full max-w-2xl scroll-mt-24 sm:mt-9" onSubmit={(event) => {
        event.preventDefault()
        openResults(formData)
      }}>
        <div className="flex min-h-15 items-center gap-2 rounded-2xl border border-input/80 bg-background p-1.5 pl-3 shadow-[0_12px_35px_-20px_#39247566] transition-[box-shadow,border-color] focus-within:border-violet-500 focus-within:shadow-[0_0_0_3px_#ede9fe] sm:gap-3 sm:rounded-full sm:pl-5">
          <Sparkles aria-hidden="true" className="size-4 shrink-0 text-violet-700 sm:size-5" />
          <label htmlFor="movie-mood" className="sr-only">Mood</label>
          <input id="movie-mood" name="mood" value={formData.mood} onChange={(event) => updateFilter('mood', event.target.value)} placeholder="A clever mystery…" className="min-h-11 w-0 flex-1 bg-transparent text-base placeholder:text-muted-foreground focus:outline-none" />
          <button type="submit" className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85 active:bg-primary/75 sm:rounded-full sm:px-5">
            Find a movie <ArrowRight aria-hidden="true" className="hidden size-4 sm:block" />
          </button>
        </div>

        <div role="group" aria-label="Mood suggestions" className="mt-3 flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {moods.map((mood) => (
            <button key={mood} type="button" aria-pressed={formData.mood === mood} onClick={() => updateFilter('mood', formData.mood === mood ? '' : mood)} className="min-h-10 cursor-pointer rounded-full border border-violet-100 bg-white/85 px-2 text-xs font-medium text-neutral-700 transition-colors hover:border-violet-200 hover:bg-violet-50 aria-pressed:border-violet-200 aria-pressed:bg-violet-100 aria-pressed:text-violet-900 sm:px-4 sm:text-sm">
              {mood}
            </button>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:gap-x-6">
          <StreamingCountryPicker value={selectedCountry} onChange={changeCountry} />
          <button type="button" aria-expanded={filtersOpen} aria-controls="search-filters" onClick={() => setFiltersOpen(!filtersOpen)} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground aria-expanded:text-violet-700">
            <SlidersHorizontal aria-hidden="true" className="size-4" /> Filters
            {filterCount > 0 && <span className="rounded-full bg-violet-100 px-1.5 text-xs font-semibold text-violet-900">{filterCount}</span>}
          </button>
          <button type="button" onClick={() => openResults(emptyPreferences)} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 transition-colors hover:text-foreground">
            <Shuffle aria-hidden="true" className="size-4" /> Surprise me
          </button>
        </div>

        <div id="search-filters" hidden={!filtersOpen} className="mt-3 border-t border-input/75 pt-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <FilterField label="Genre" value={formData.genre} onChange={(event) => updateFilter('genre', event.target.value)} options={genres} placeholder="Any genre" />
            <FilterField label="Language" value={formData.language} onChange={(event) => updateFilter('language', event.target.value)} options={languages} placeholder="Any language" />
            <FilterField label="Streaming service" value={formData.platform} onChange={(event) => updateFilter('platform', event.target.value)} options={platforms} placeholder={selectedCountry ? 'Any service' : 'Choose a country first'} disabled={!selectedCountry} />
            <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-left text-sm text-muted-foreground">
              <input type="checkbox" checked={formData.includeClassics} onChange={(event) => updateFilter('includeClassics', event.target.checked)} className="size-4 accent-violet-700" />
              Include classics
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 self-end text-left text-sm text-muted-foreground">
              <input type="checkbox" checked={formData.short} onChange={(event) => updateFilter('short', event.target.checked)} className="size-4 accent-violet-700" />
              90 minutes or less
            </label>
          </div>
        </div>
      </form>
    </section>
  )
}

function DiscoveryFromUrl() {
  const params = useSearchParams()
  const region = params.get('region')
  const platform = params.get('platform')
  const initial = {
    genre: genres.includes(params.get('genre')) ? params.get('genre') : '',
    mood: params.get('mood') ?? '',
    language: languages.includes(params.get('language')) ? params.get('language') : '',
    platform: region !== '' && platforms.includes(platform === 'Prime Video' ? 'Amazon Prime' : platform)
      ? (platform === 'Prime Video' ? 'Amazon Prime' : platform)
      : '',
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
