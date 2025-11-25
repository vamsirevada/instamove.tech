'use client'

import { useState, useEffect } from 'react'

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('instamovie_watchlist')
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse watchlist', e)
      }
    }
    setIsLoaded(true)
  }, [])

  const addToWatchlist = (movie) => {
    const updated = [...watchlist, movie]
    setWatchlist(updated)
    localStorage.setItem('instamovie_watchlist', JSON.stringify(updated))
  }

  const removeFromWatchlist = (movieId) => {
    const updated = watchlist.filter((m) => m.id !== movieId)
    setWatchlist(updated)
    localStorage.setItem('instamovie_watchlist', JSON.stringify(updated))
  }

  const isInWatchlist = (movieId) => {
    return watchlist.some((m) => m.id === movieId)
  }

  return {
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    isLoaded,
  }
}
