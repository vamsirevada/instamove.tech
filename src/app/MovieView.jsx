'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Film, Heart, Play, RefreshCw, Share2, Sparkles, Star, X } from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { MovieWatch } from './MovieWatch'
import { useStreamingCountry } from './useStreamingCountry'

function MovieMedia({ movie }) {
  const [showTrailer, setShowTrailer] = useState(false)
  return (
    <div className="mx-auto w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:max-w-none">
      <div className={`relative overflow-hidden rounded-[1.15rem] bg-muted ${showTrailer ? 'aspect-video' : 'aspect-[2/3]'}`}>
        {showTrailer ? (
          <iframe
            src={`https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1`}
            title={`${movie.title} Trailer`}
            className="absolute inset-0 size-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : movie.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
            alt={movie.title}
            fill
            sizes="(min-width: 75rem) 27rem, (min-width: 64rem) 38vw, (min-width: 30rem) 28rem, 90vw"
            className="object-cover"
            preload
          />
        ) : (
          <div className="grid size-full place-items-center">
            <Film aria-hidden="true" className="size-16 text-muted-foreground/35" />
          </div>
        )}

        {movie.trailerKey && (
          <button
            type="button"
            onClick={() => setShowTrailer(!showTrailer)}
            aria-label={showTrailer ? 'Close trailer' : 'Watch trailer'}
            aria-expanded={showTrailer}
            className={`absolute right-3 grid size-11 cursor-pointer place-items-center rounded-full transition-colors ${showTrailer ? 'top-3 bg-black/75 text-white hover:bg-black' : 'bottom-3 bg-white text-violet-900 hover:bg-violet-100'}`}
          >
            {showTrailer ? <X aria-hidden="true" className="size-5" /> : <Play aria-hidden="true" className="size-5 fill-current" />}
          </button>
        )}
      </div>
    </div>
  )
}

export function MovieView({
  movie,
  discoverHref,
  onAnother,
  loading = false,
  retryBlocked = false,
  errorMessage,
}) {
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, isLoaded } = useWatchlist()
  const [share, setShare] = useState(null)
  const [region, setRegion] = useStreamingCountry(movie.streamingRegion ?? null)
  const shareFeedback = share?.movieId === movie.id ? share : null

  async function handleShare() {
    const url = new URL(`/movie/${movie.tmdbId}`, window.location.origin).href
    setShare(null)

    if (navigator.share) {
      try {
        await navigator.share({ title: movie.title, url })
        return
      } catch (error) {
        if (error.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setShare({ movieId: movie.id, message: 'Movie link copied.' })
    } catch {
      setShare({ movieId: movie.id, url })
    }
  }

  function toggleWatchlist() {
    if (isInWatchlist(movie.id)) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[80rem] px-4 pb-10 pt-4 sm:px-7 sm:pb-14 lg:px-10 lg:pt-6">
      <div className="mb-4 flex items-center border-b border-border pb-2 sm:mb-7">
        <Link href={discoverHref} className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-violet-800">
          <ArrowLeft aria-hidden="true" className="size-4 motion-safe:transition-transform motion-safe:group-hover:-translate-x-0.5" /> {onAnother ? 'Edit preferences' : 'Discover movies'}
        </Link>
      </div>

      <article className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.83fr)_minmax(0,1.6fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <div className="min-w-0 space-y-5 lg:col-start-2 lg:pt-2">
          <div key={movie.id} aria-busy={loading} className="motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
            <h1 className="mb-3 text-balance text-[clamp(2.55rem,5vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.06em]">
              {movie.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground sm:gap-3 sm:text-sm">
              {movie.year && <span>{movie.year}</span>}
              {movie.runtime && <span className="rounded-full bg-violet-100 px-2.5 py-1 font-medium text-violet-900">{movie.runtime}</span>}
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
              {movie.genres && movie.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="line-clamp-1">
                    {movie.genres.join(', ')}
                  </span>
                </>
              )}
            </div>
            {movie.recommendationSource === 'catalog' && (
              <p className="mt-3 text-sm text-muted-foreground">Catalog pick based on your filters.</p>
            )}
            {movie.director && <p className="mt-3 text-sm text-muted-foreground">Directed by {movie.director}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 pb-1">
            {onAnother && (
              <button
                type="button"
                disabled={loading || retryBlocked}
                onClick={onAnother}
                className="inline-flex min-h-11 min-w-32 cursor-pointer items-center justify-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-75"
              >
                <RefreshCw aria-hidden="true" className={`size-4 ${loading ? 'motion-safe:animate-spin' : ''}`} />
                {loading ? 'Finding…' : 'Find another'}
              </button>
            )}
            <button
              type="button"
              onClick={toggleWatchlist}
              disabled={!isLoaded}
              aria-pressed={isInWatchlist(movie.id)}
              aria-label={isInWatchlist(movie.id) ? 'Remove movie from watchlist' : 'Save movie to watchlist'}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-medium transition-colors hover:border-violet-300 hover:bg-violet-50 aria-pressed:text-violet-700"
            >
              <Heart aria-hidden="true" className={`size-4 ${isInWatchlist(movie.id) ? 'fill-current' : ''}`} />
              {isInWatchlist(movie.id) ? 'Saved' : 'Save'}
            </button>
            {movie.tmdbId && (
              <button type="button" onClick={handleShare} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3.5 text-sm font-medium transition-colors hover:border-violet-300 hover:bg-violet-50">
                <Share2 aria-hidden="true" className="size-4" /> Share
              </button>
            )}
          </div>
          <div role="status" className={errorMessage || shareFeedback?.message ? '-mt-3 text-sm text-muted-foreground' : 'sr-only'}>
            {errorMessage || shareFeedback?.message || (loading ? 'Finding another movie…' : '')}
          </div>
          {shareFeedback?.url && (
            <label className="block text-sm font-medium">
              Movie link
              <input readOnly value={shareFeedback.url} onFocus={(event) => event.target.select()} className="mt-1 block w-full max-w-lg rounded-lg border bg-background px-3 py-2 font-normal" />
            </label>
          )}

          <MovieWatch movie={movie} region={region} onRegionChange={setRegion} />
        </div>

        <MovieMedia key={movie.id} movie={movie} />

        <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-start-2 lg:row-start-2">
          {/* Synopsis */}
          {movie.overview && (
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-1.5 sm:mb-2">
                Synopsis
              </h2>
              <p className="text-sm sm:text-base leading-relaxed">
                {movie.overview}
              </p>
            </div>
          )}

          {/* AI Reasoning */}
          {movie.aiReasoning && (
            <div className="border-l-2 border-violet-300 bg-violet-50/60 p-4 sm:p-5">
              <div className="flex items-start gap-2 sm:gap-3">
                <Sparkles aria-hidden="true" className="h-4 w-4 sm:h-5 sm:w-5 text-violet-700 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2">
                    Why this movie?
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {movie.aiReasoning}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
