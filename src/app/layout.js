import { headers } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { StreamingCountryProvider } from './useStreamingCountry'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'InstaMovie | Find your next movie',
  description: 'Find a movie for your mood and see where to watch it in your country.',
}

export default async function RootLayout({ children }) {
  const geoCountry = (await headers()).get('x-vercel-ip-country')
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative bg-[#fcfbfe]`}
      >
        <Navbar />
        <main className="flex-1 relative z-10">
          <StreamingCountryProvider geoCountry={geoCountry}>{children}</StreamingCountryProvider>
        </main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
