# Instamovie - AI-Powered Movie Discovery

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API Keys

Create a `.env.local` file in the root directory with your API keys:

```env
# TMDB API Key - Get from https://www.themoviedb.org/settings/api
TMDB_API_KEY=your_tmdb_api_key_here

# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here
```

**Important:** Never commit the `.env.local` file to version control. It's already included in `.gitignore`.

### 3. Get Your API Keys

#### TMDB API Key:

1. Go to https://www.themoviedb.org/
2. Create an account or log in
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy your API key to `.env.local`

#### OpenAI API Key:

1. Go to https://platform.openai.com/
2. Create an account or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy your API key to `.env.local`

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **AI-Powered Recommendations**: Uses OpenAI GPT-3.5 to generate personalized movie recommendations
- **TMDB Integration**: Fetches movie details, posters, and ratings from The Movie Database
- **Secure API Keys**: All API keys are stored server-side and never exposed to the client
- **Beautiful UI**: Modern, responsive design with dot pattern background
- **Smart Search**: Filter by genre, mood, language, and streaming platform

## How It Works

1. User fills out preferences (genre, mood, language, platform)
2. Form data is sent to the `/api/recommend` endpoint
3. OpenAI generates 5 movie recommendations based on preferences
4. TMDB API fetches detailed information for each recommended movie
5. Results are displayed with posters, ratings, and AI-generated reasons

## Security

- API keys are stored in environment variables
- All API calls are made server-side (Next.js API routes)
- Client never has access to API keys
- `.env.local` is gitignored to prevent accidental commits
