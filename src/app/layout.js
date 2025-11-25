import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { DotPattern } from '@/components/ui/dot-pattern'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Instamovie - Discover Your Next Favorite Film',
  description: 'AI-powered movie discovery platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative`}
      >
        <DotPattern
          className={cn(
            'text-neutral-400/40',
            '[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]'
          )}
        />
        <Navbar />
        <main className="flex-1 relative z-10">{children}</main>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
