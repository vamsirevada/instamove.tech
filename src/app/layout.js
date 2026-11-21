import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
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
  title: 'Instamovie - Discover Your Next Favorite Film',
  description: 'AI-powered movie discovery platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 text-neutral-400/40 [background-image:radial-gradient(circle_at_1px_1px,currentColor_0.8px,transparent_1.15px)] [background-size:16px_16px] [mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]"
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
