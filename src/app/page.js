'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Sparkles, Search, Smile, Globe, Monitor } from 'lucide-react'
import { CompanyLogo } from '@/components/CompanyLogo'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    genre: '',
    mood: '',
    language: '',
    platform: '',
    includeClassics: false,
  })

  const platforms = [
    'Netflix',
    'Amazon Prime',
    'Disney+',
    'Hulu',
    'HBO Max',
    'Apple TV+',
    'Paramount+',
    'Peacock',
    'YouTube',
  ]

  const handleSubmit = (e) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (formData.genre) params.set('genre', formData.genre)
    if (formData.mood) params.set('mood', formData.mood)
    if (formData.language) params.set('language', formData.language)
    if (formData.platform) params.set('platform', formData.platform)
    params.set('includeClassics', formData.includeClassics.toString())

    router.push(`/results?${params.toString()}`)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center px-4 py-12 space-y-8">
      {/* Hero Section */}
      <div className="space-y-6 max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground bg-background shadow-sm">
          <Sparkles className="mr-2 h-3.5 w-3.5" />
          AI-Powered Discovery
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Find your next{' '}
          <span className="text-muted-foreground/80">masterpiece.</span>
        </h1>

        <p className="text-lg text-muted-foreground sm:text-xl max-w-2xl mx-auto">
          Stop scrolling. Start watching. Tell us your vibe, and our AI will
          curate the perfect film for this exact moment.
        </p>
      </div>

      {/* Search Card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-3xl bg-card rounded-xl shadow-lg border p-2 sm:p-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Genre Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={formData.genre}
              onChange={(e) =>
                setFormData({ ...formData, genre: e.target.value })
              }
              className="w-full h-12 pl-10 pr-4 rounded-md border bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
            >
              <option value="">Select Genre</option>
              <option value="Action">Action</option>
              <option value="Sci-Fi">Sci-Fi</option>
              <option value="Comedy">Comedy</option>
              <option value="Drama">Drama</option>
              <option value="Horror">Horror</option>
              <option value="Romance">Romance</option>
              <option value="Thriller">Thriller</option>
              <option value="Documentary">Documentary</option>
              <option value="Indie">Indie / Art House</option>
            </select>
          </div>

          {/* Mood Input */}
          <div className="relative">
            <Smile className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Current Mood"
              value={formData.mood}
              onChange={(e) =>
                setFormData({ ...formData, mood: e.target.value })
              }
              className="w-full h-12 pl-10 pr-4 rounded-md border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Language Input */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
              className="w-full h-12 pl-10 pr-4 rounded-md border bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
            >
              <option value="">Any Language</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
              <option value="Tamil">Tamil</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Kannada">Kannada</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="Korean">Korean</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          {/* Platform Input with Logo */}
          <div className="relative">
            {formData.platform ? (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                <CompanyLogo name={formData.platform} size={20} />
              </div>
            ) : (
              <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            )}
            <select
              value={formData.platform}
              onChange={(e) =>
                setFormData({ ...formData, platform: e.target.value })
              }
              className={`w-full h-12 ${
                formData.platform ? 'pl-11' : 'pl-10'
              } pr-4 rounded-md border bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none`}
            >
              <option value="">Any Platform</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <label className="flex items-center space-x-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={formData.includeClassics}
              onChange={(e) =>
                setFormData({ ...formData, includeClassics: e.target.checked })
              }
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
            />
            <span>Include Classics</span>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center h-10 px-8 rounded-md bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
          >
            Find Movie
          </button>
        </div>
      </form>
    </div>
  )
}
