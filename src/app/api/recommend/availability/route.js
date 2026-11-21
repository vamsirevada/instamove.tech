import { NextResponse } from 'next/server'
import { getStreamingAvailability, isMovieId, isStreamingRegion } from '../tmdb'

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const movieId = params.get('movie')
  const region = params.get('region')
  if (!isMovieId(movieId) || !isStreamingRegion(region)) {
    return NextResponse.json({ error: 'Choose a valid movie and country.' }, { status: 400 })
  }

  try {
    return NextResponse.json(await getStreamingAvailability(movieId, region))
  } catch (error) {
    console.warn('TMDB availability lookup failed', error.cause?.code || error.message)
    return NextResponse.json({ error: 'Streaming availability couldn’t be verified.' }, { status: 503 })
  }
}
