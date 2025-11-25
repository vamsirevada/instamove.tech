import Link from 'next/link'
import { Film, Search } from 'lucide-react'

export default function WatchlistPage() {
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
