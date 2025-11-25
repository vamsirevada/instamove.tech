'use client'

import Link from 'next/link'
import { Film, Search, Trash2, Star } from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'
import Image from 'next/image'

export default function WatchlistPage() {
  const { watchlist, removeFromWatchlist, isLoaded } = useWatchlist()

  if (!isLoaded) {
    return null // Prevent hydration mismatch
  }

  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 py-12 space-y-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted mb-2">
          <Film className="w-10 h-10 text-muted-foreground/50" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">
            Your collection is empty
          </h1>
          <p className="text-muted-foreground">
            Curate your personal film library by discovering new favorites.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 mt-4"
        >
          <Search className="mr-2 h-4 w-4" />
          Discover Movies
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Watchlist</h1>
        <span className="text-muted-foreground text-sm">
          {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {watchlist.map((movie) => (
          <div
            key={movie.id}
            className="group relative bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="relative aspect-[2/3] bg-muted">
              {movie.posterPath ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}

              <button
                onClick={() => removeFromWatchlist(movie.id)}
                className="absolute top-2 right-2 p-2 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                title="Remove from Watchlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <h3 className="font-semibold leading-tight line-clamp-1">
                {movie.title}
              </h3>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{movie.year}</span>
                {movie.voteAverage && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>{movie.voteAverage.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                {movie.genres &&
                  movie.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px]"
                    >
                      {genre}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
