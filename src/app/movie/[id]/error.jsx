'use client'

import Link from 'next/link'

export default function MovieError({ reset }) {
  return (
    <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Couldn’t load this movie</h1>
      <p className="text-sm text-muted-foreground">The movie catalog is temporarily unavailable.</p>
      <button type="button" onClick={reset} className="min-h-11 cursor-pointer rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Try again</button>
      <Link href="/" className="text-sm underline underline-offset-2">Discover movies</Link>
    </div>
  )
}
