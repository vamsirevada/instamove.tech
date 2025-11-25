import Image from 'next/image'

const LOGO_DEV_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_LOGO_DEV_KEY || 'pk_cQB-XufgRUmUmlv3Cb6ukA'

export function CompanyLogo({ name, size = 32 }) {
  // Map platform names to their actual domains for Logo.dev
  const domainMap = {
    Netflix: 'netflix.com',
    'Amazon Prime': 'primevideo.com',
    'Disney+': 'disneyplus.com',
    Hulu: 'hulu.com',
    'HBO Max': 'max.com',
    'Apple TV+': 'tv.apple.com',
    'Paramount+': 'paramountplus.com',
    Peacock: 'peacocktv.com',
    YouTube: 'youtube.com',
  }

  const domain =
    domainMap[name] || name.toLowerCase().replace(/\s+/g, '') + '.com'

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <Image
        src={`https://img.logo.dev/${domain}?token=${LOGO_DEV_PUBLIC_KEY}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="rounded object-contain"
        unoptimized
      />
    </div>
  )
}
