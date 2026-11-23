'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { MovieView } from '@/app/MovieView'
import { countryCodes, useStreamingCountry } from '@/app/useStreamingCountry'

const recentMoviesKey = 'instamovie:recent-recommendations'
const maxRecentMovies = 50

function readRecentMovies(fallback) {
  try {
    const stored = JSON.parse(localStorage.getItem(recentMoviesKey))
    if (Array.isArray(stored)) return stored.filter(Number.isSafeInteger).slice(-maxRecentMovies)
  } catch {
    // The current results page can still track recommendations in memory.
  }
  return fallback
}

function ResultsContent({ searchParams }) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const recentMovies = useRef([])
  const requestedRegion = searchParams.get('region')
  const initialRegion = requestedRegion === '' || countryCodes.has(requestedRegion) ? requestedRegion : null
  const [region] = useStreamingCountry(initialRegion)
  const query = searchParams.toString()
  const discoverHref = query ? `/?${query}#movie-finder` : '/#movie-finder'

  const fetchRecommendation = useCallback(async ({ previousReleaseYear, previousMovieId, selectedRegion = region, signal } = {}) => {
    try {
      setLoading(true)
      setError(null)

      const recentMovieIds = readRecentMovies(recentMovies.current)
      const response = await fetch('/api/recommend', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genre: searchParams.get('genre'),
          mood: [searchParams.get('vibe'), searchParams.get('mood')].filter(Boolean).join('. '),
          language: searchParams.get('language'),
          platforms: selectedRegion ? searchParams.getAll('platform') : [],
          region: selectedRegion,
          includeClassics: searchParams.get('includeClassics') === 'true',
          short: searchParams.get('short') === 'true',
          previousReleaseYear,
          previousMovieId,
          recentMovieIds,
        }),
      })

      const data = await response.json()
      if (signal?.aborted) return

      if (response.ok) {
        const id = data.movie.tmdbId ?? data.movie.id
        const history = readRecentMovies(recentMovieIds)
        recentMovies.current = [...history.filter((movieId) => movieId !== id), id].slice(-maxRecentMovies)
        try {
          localStorage.setItem(recentMoviesKey, JSON.stringify(recentMovies.current))
        } catch {
          // Keep using the history stored on this page.
        }
        setMovie(data.movie)
      } else {
        setError({
          status: response.status,
          retryAt: response.status === 429 ? Date.now() + Math.max(1, Number(response.headers.get('retry-after')) || 1) * 1000 : null,
          message: data.error || data.message || 'Couldn’t get a recommendation. Try again.',
        })
      }
    } catch {
      if (!signal?.aborted) setError({ message: 'Couldn’t get a recommendation. Try again.' })
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [searchParams, region])

  useEffect(() => {
    if (region === null) return
    const controller = new AbortController()
    const timer = setTimeout(() => fetchRecommendation({ signal: controller.signal }), 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [fetchRecommendation, region])

  const retryAt = error?.retryAt
  useEffect(() => {
    if (!retryAt) return
    const timer = setTimeout(() => {
      setError((current) => current?.retryAt === retryAt
        ? { ...current, retryAt: null, message: 'You can try again now.' }
        : current)
    }, Math.max(0, retryAt - Date.now()))
    return () => clearTimeout(timer)
  }, [retryAt])

  if (loading && !movie) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="space-y-2">
              <p role="status" className="text-sm font-medium text-muted-foreground">Finding your movie…</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          <Skeleton className="w-full lg:w-1/3 aspect-[2/3] rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!movie && error && error.status !== 404) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold">
            {error.status === 429 ? 'Recommendation limit reached' : 'Couldn’t find a movie'}
          </h2>
          <p role="status" className="text-sm sm:text-base text-muted-foreground">{error.message}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => fetchRecommendation()}
              disabled={Boolean(retryAt)}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-65"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </button>
            <Link
              href={discoverHref}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-center space-y-4">
          <p className="text-sm sm:text-lg text-muted-foreground">
            {error?.message || 'No movie found. Try different preferences.'}
          </p>
          <Link
            href={discoverHref}
            className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <MovieView
      movie={movie}
      discoverHref={discoverHref}
      onAnother={(selectedRegion) => fetchRecommendation({
        previousReleaseYear: movie.year,
        previousMovieId: movie.id,
        selectedRegion,
      })}
      loading={loading}
      retryBlocked={Boolean(retryAt)}
      errorMessage={error?.message}
    />
  )
}

function ResultsFromUrl() {
  const searchParams = useSearchParams()
  return <ResultsContent key={searchParams.toString()} searchParams={searchParams} />
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm sm:text-lg text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <ResultsFromUrl />
    </Suspense>
  )
}
