import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Track seen movies to avoid repetition (in production, use a database)
let seenMovies = []

export async function POST(request) {
  try {
    const { genre, mood, language, platform, includeClassics } =
      await request.json()

    // Random personas for diverse recommendations
    const personas = [
      'a film festival programmer looking for hidden gems',
      'a genre specialist looking for cult classics',
      'a mainstream critic looking for highly-rated but overlooked hits',
      'a visual arts student looking for stunning cinematography',
      'a screenwriter looking for brilliant dialogue',
    ]
    const selectedPersona =
      personas[Math.floor(Math.random() * personas.length)]

    // Random seed for variety
    const randomSeed = Math.random().toString(36).substring(7)

    const prompt = `Act as ${selectedPersona}.
Recommend a single unique movie based on the following preferences.

CRITICAL: DIVERSIFY YOUR SUGGESTIONS.
- Do NOT suggest "Parasite", "Inception", "The Godfather", "Interstellar", or "The Shawshank Redemption" unless specifically requested.
- Do NOT suggest any of the following movies as they have already been seen/suggested: ${JSON.stringify(
      seenMovies
    )}.
- If the inputs are generic, favor "Great but less obvious" movies over "The most famous movie of all time".
- Ensure the movie is available on major streaming platforms.
- Include movies from various regions, especially Indian movies (Bollywood, Tollywood, Kollywood, etc.) if the language preference allows or is "Any".

User Preferences:
Genre: ${genre || 'Any (Surprise me)'}
Mood: ${mood || 'Any'}
Preferred Platform: ${platform || 'Any'}
Preferred Language: ${language || 'Any'}
Include Classics (Pre-2000): ${
      includeClassics ? 'Yes' : 'No (Focus on post-2000)'
    }
Request ID: ${randomSeed}

Provide a detailed response in JSON format with the following structure:
{
  "title": "Movie Title",
  "year": "Release Year",
  "director": "Director Name",
  "genre": ["Genre1", "Genre2"],
  "rating": "IMDB or Rotten Tomatoes score",
  "synopsis": "Brief plot summary",
  "reasoning": "Why this movie fits the user request (be specific, not generic)",
  "streamingProviders": ["Platform1", "Platform2"],
  "posterDescription": "Concise visual description of the movie's official poster",
  "runtime": "e.g. 1h 45m",
  "language": "Language of the movie"
}

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable film curator with expertise in cinema from around the world. Always respond with valid JSON only, no markdown formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.9, // Higher temperature for more variety
    })

    const recommendationText = completion.choices[0].message.content.trim()

    // Remove markdown code blocks if present
    const cleanedText = recommendationText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const recommendation = JSON.parse(cleanedText)

    // Add to seen movies list
    seenMovies.push(recommendation.title)

    // Keep only last 50 movies to prevent memory issues
    if (seenMovies.length > 50) {
      seenMovies = seenMovies.slice(-50)
    }

    // Fetch movie details from TMDB
    try {
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${
          process.env.TMDB_API_KEY
        }&query=${encodeURIComponent(recommendation.title)}&year=${
          recommendation.year
        }`
      )
      const searchData = await searchResponse.json()

      if (searchData.results && searchData.results.length > 0) {
        const movie = searchData.results[0]

        // Fetch videos (trailers)
        const videosResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${process.env.TMDB_API_KEY}`
        )
        const videosData = await videosResponse.json()
        const trailer = videosData.results?.find(
          (video) => video.site === 'YouTube' && video.type === 'Trailer'
        )

        return NextResponse.json({
          movie: {
            id: movie.id,
            title: movie.title,
            overview: movie.overview || recommendation.synopsis,
            posterPath: movie.poster_path,
            backdropPath: movie.backdrop_path,
            releaseDate: movie.release_date,
            voteAverage: movie.vote_average,
            trailerKey: trailer ? trailer.key : null,
            // AI-generated details
            director: recommendation.director,
            genres: recommendation.genre,
            aiRating: recommendation.rating,
            aiReasoning: recommendation.reasoning,
            streamingProviders: recommendation.streamingProviders,
            runtime: recommendation.runtime,
            language: recommendation.language,
            year: recommendation.year,
          },
        })
      } else {
        // If TMDB doesn't have the movie, return AI data only
        return NextResponse.json({
          movie: {
            id: Date.now(), // Temporary ID
            title: recommendation.title,
            overview: recommendation.synopsis,
            posterPath: null,
            backdropPath: null,
            releaseDate: `${recommendation.year}-01-01`,
            voteAverage: null,
            director: recommendation.director,
            genres: recommendation.genre,
            aiRating: recommendation.rating,
            aiReasoning: recommendation.reasoning,
            streamingProviders: recommendation.streamingProviders,
            runtime: recommendation.runtime,
            language: recommendation.language,
            year: recommendation.year,
          },
        })
      }
    } catch (tmdbError) {
      console.error('TMDB API error:', tmdbError)
      // Return AI data if TMDB fails
      return NextResponse.json({
        movie: {
          id: Date.now(),
          title: recommendation.title,
          overview: recommendation.synopsis,
          posterPath: null,
          backdropPath: null,
          releaseDate: `${recommendation.year}-01-01`,
          voteAverage: null,
          director: recommendation.director,
          genres: recommendation.genre,
          aiRating: recommendation.rating,
          aiReasoning: recommendation.reasoning,
          streamingProviders: recommendation.streamingProviders,
          runtime: recommendation.runtime,
          language: recommendation.language,
          year: recommendation.year,
        },
      })
    }
  } catch (error) {
    console.error('Error in recommend API:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendation: ' + error.message },
      { status: 500 }
    )
  }
}
