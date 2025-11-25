'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Sparkles, Film, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { CompanyLogo } from '@/components/CompanyLogo'

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecommendation = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          genre: searchParams.get('genre'),
          mood: searchParams.get('mood'),
          language: searchParams.get('language'),
          platform: searchParams.get('platform'),
          includeClassics: searchParams.get('includeClassics') === 'true',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation')
      }

      const data = await response.json()
      setMovie(data.movie)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendation()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Finding your perfect movie...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold">
            Oops! Something went wrong
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={fetchRecommendation}
              className="inline-flex items-center justify-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </button>
            <Link
              href="/"
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
            No movie found. Try different preferences.
          </p>
          <Link
            href="/"
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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold mb-1">
              Your Perfect Match
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              AI-curated just for you
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={fetchRecommendation}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-6 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-medium transition-colors hover:bg-primary/90"
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Get Another</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-6 rounded-full border border-input bg-background hover:bg-accent text-xs sm:text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">New Search</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Movie Content */}
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
        {/* Movie Poster */}
        <div className="w-full lg:w-1/3 flex-shrink-0">
          <div className="relative aspect-[2/3] max-w-sm mx-auto lg:mx-0 overflow-hidden rounded-xl bg-muted shadow-2xl">
            {movie.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="h-16 w-16 sm:h-24 sm:w-24 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>

        {/* Movie Details */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Title and Metadata */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2 leading-tight">
              {movie.title}
              {movie.director && (
                <span className="block sm:inline text-lg sm:text-xl lg:text-2xl font-normal text-muted-foreground mt-1 sm:mt-0">
                  {' '}
                  <span className="hidden sm:inline">by </span>
                  <span className="sm:hidden">Dir: </span>
                  {movie.director}
                </span>
              )}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
              {movie.year && <span>{movie.year}</span>}
              {movie.runtime && (
                <>
                  <span>•</span>
                  <span>{movie.runtime}</span>
                </>
              )}
              {movie.language && (
                <>
                  <span>•</span>
                  <span>{movie.language}</span>
                </>
              )}
              {movie.voteAverage && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-yellow-500 text-yellow-500" />
                    <span>{movie.voteAverage.toFixed(1)}/10</span>
                  </div>
                </>
              )}
              {movie.aiRating && (
                <>
                  <span>•</span>
                  <span>{movie.aiRating}</span>
                </>
              )}
              {movie.genres && movie.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="line-clamp-1">
                    {movie.genres.join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Synopsis */}
          {movie.overview && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1.5 sm:mb-2">
                Synopsis
              </h3>
              <p className="text-sm sm:text-base leading-relaxed">
                {movie.overview}
              </p>
            </div>
          )}

          {/* AI Reasoning */}
          {movie.aiReasoning && (
            <div className="bg-card border border-border rounded-lg p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                    Why This Movie?
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {movie.aiReasoning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Streaming Providers */}
          {movie.streamingProviders && movie.streamingProviders.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1.5 sm:mb-2">
                Available On
              </h3>
              <div className="flex flex-wrap gap-3">
                {movie.streamingProviders.map((provider, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-accent/50 border border-border"
                  >
                    <CompanyLogo name={provider} size={24} />
                    <span className="text-xs sm:text-sm font-medium">
                      {provider}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
