import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getMovieDetails, isMovieId, movieFromDetails } from '@/app/api/recommend/tmdb'
import { MovieView } from '@/app/MovieView'

const loadMovie = cache(async (id) => {
  if (!isMovieId(id)) return null
  try {
    const details = await getMovieDetails(id)
    if (details.adult || details.id !== Number(id) || !details.title) return null
    return movieFromDetails(details)
  } catch (error) {
    if (error.status === 404) return null
    throw error
  }
})

export async function generateMetadata({ params }) {
  const { id } = await params
  const movie = await loadMovie(id).catch(() => null)
  if (!movie) return { title: 'Movie | Instamovie' }

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title
  const description = movie.overview || 'See where this movie is streaming in your country on Instamovie.'
  const images = movie.posterPath
    ? [{ url: `https://image.tmdb.org/t/p/w780${movie.posterPath}`, alt: movie.title }]
    : []
  return {
    title: `${title} | Instamovie`,
    description,
    openGraph: { type: 'video.movie', siteName: 'Instamovie', title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function SharedMoviePage({ params }) {
  const { id } = await params
  const movie = await loadMovie(id)
  if (!movie) notFound()
  return <MovieView key={movie.id} movie={movie} discoverHref="/#movie-finder" />
}
