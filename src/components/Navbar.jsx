'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clapperboard, Heart, Search } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isWatchlist = pathname === '/watchlist'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-[#fcfbfe]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[80rem] items-center justify-between px-4 sm:px-7 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 transition-opacity hover:opacity-90"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-[0.55rem] bg-violet-700 text-white"><Clapperboard aria-hidden="true" className="size-4.5" /></span>
          <span className="text-base font-bold tracking-[-0.04em] sm:text-lg">
            InstaMovie
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            aria-label="Discover"
            aria-current={isHome ? 'page' : undefined}
            className={`inline-flex items-center justify-center h-11 px-2.5 min-[380px]:px-3 sm:px-6 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              isHome
                ? 'bg-violet-100 text-violet-900 hover:bg-violet-200'
                : 'text-muted-foreground hover:bg-violet-50 hover:text-violet-900'
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
                ? 'bg-violet-100 text-violet-900 hover:bg-violet-200'
                : 'text-muted-foreground hover:bg-violet-50 hover:text-violet-900'
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
