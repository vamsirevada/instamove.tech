import { NextResponse } from 'next/server'
import { getStreamingAvailability, isMovieId, isStreamingRegion } from '../tmdb'

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const movieIds = [...new Set(params.getAll('movie'))]
  const region = params.get('region')
  if (!movieIds.length || movieIds.length > 4 || !movieIds.every(isMovieId) || !isStreamingRegion(region)) {
    return NextResponse.json({ error: 'Choose a valid movie and country.' }, { status: 400 })
  }

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(4000)])
  if (movieIds.length > 1) {
    const results = await Promise.allSettled(
      movieIds.map(async (id) => [id, await getStreamingAvailability(id, region, signal)])
    )
    return NextResponse.json({
      movies: Object.fromEntries(results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])),
    })
  }

  try {
    return NextResponse.json(await getStreamingAvailability(movieIds[0], region, signal))
  } catch (error) {
    console.warn('TMDB availability lookup failed', error.cause?.code || error.message)
    return NextResponse.json({ error: 'Streaming availability couldn’t be verified.' }, { status: 503 })
  }
}
