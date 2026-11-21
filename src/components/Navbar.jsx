'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clapperboard, Heart, Search } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isWatchlist = pathname === '/watchlist'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container flex h-14 sm:h-16 items-center justify-between mx-auto px-3 sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 transition-opacity hover:opacity-90"
        >
          <Clapperboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="text-base sm:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Instamovie
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            aria-label="Discover"
            aria-current={isHome ? 'page' : undefined}
            className={`inline-flex items-center justify-center h-11 px-2.5 min-[380px]:px-3 sm:px-6 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              isHome
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-transparent text-muted-foreground hover:text-primary border border-input'
            }`}
          >
            <Search className="size-3.5 min-[380px]:mr-1.5 sm:size-4 sm:mr-2" />
            <span className="hidden min-[380px]:inline">Discover</span>
          </Link>
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            aria-current={isWatchlist ? 'page' : undefined}
            className={`inline-flex items-center justify-center h-11 px-2.5 min-[380px]:px-3 sm:px-6 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              isWatchlist
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-transparent text-muted-foreground hover:text-primary'
            }`}
          >
            <Heart className="size-3.5 min-[380px]:mr-1.5 sm:size-4 sm:mr-2" />
            <span className="hidden min-[380px]:inline">Watchlist</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
