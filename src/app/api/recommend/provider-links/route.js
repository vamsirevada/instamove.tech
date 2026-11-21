import { NextResponse } from 'next/server'
import { getProviderLinks } from '../provider-links'
import { isMovieId, isStreamingRegion } from '../tmdb'

export async function GET(request) {
  const params = new URL(request.url).searchParams
  const movieId = params.get('movie')
  const region = params.get('region')
  if (!isMovieId(movieId) || !isStreamingRegion(region)) {
    return NextResponse.json({ error: 'Choose a valid movie and country.' }, { status: 400 })
  }

  try {
    return NextResponse.json({ links: await getProviderLinks(movieId, region) })
  } catch {
    return NextResponse.json({ links: {} })
  }
}
