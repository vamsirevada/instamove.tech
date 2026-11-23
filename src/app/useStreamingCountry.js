'use client'

import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import countries from './streaming-countries.json'
import timeZoneCountries from './streaming-timezones.json'

const StreamingGeoContext = createContext(null)
const countryPreferenceKey = 'instamovie_country'
const legacyCountryPreferenceKey = 'instamovie_streaming_country'
export const countryCodes = new Set(countries.map(({ code }) => code))

function normalizeCountry(value) {
  const code = value?.trim().toUpperCase()
  return countryCodes.has(code) ? code : null
}

export function StreamingCountryProvider({ geoCountry, children }) {
  const country = normalizeCountry(geoCountry)
  return <StreamingGeoContext.Provider value={country}>{children}</StreamingGeoContext.Provider>
}

export function detectUserCountry(serverCountry) {
  const geoCountry = normalizeCountry(serverCountry)
  if (typeof window === 'undefined') return geoCountry ?? 'US'

  try {
    const saved = normalizeCountry(
      localStorage.getItem(countryPreferenceKey) ?? localStorage.getItem(legacyCountryPreferenceKey)
    )
    if (saved) return saved
  } catch {
    // Country selection still works for the current search.
  }

  if (geoCountry) return geoCountry

  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const country = timeZoneCountries[timeZone]
    if (countryCodes.has(country)) return country
  } catch {
    // Continue with the browser locale when its time zone is unavailable.
  }

  try {
    const region = new Intl.Locale(navigator.language).region
    if (countryCodes.has(region)) return region
  } catch {
    // Some browser language preferences do not contain a usable locale.
  }

  return 'US'
}

function subscribeToCountryPreference(callback) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

export function useStreamingCountry(initialCountry = null) {
  const [country, setCountry] = useState(initialCountry)
  const geoCountry = useContext(StreamingGeoContext)
  const suggestedCountry = useSyncExternalStore(
    subscribeToCountryPreference,
    () => detectUserCountry(geoCountry),
    () => geoCountry
  )

  function changeCountry(region) {
    setCountry(region)
    try {
      if (countryCodes.has(region)) localStorage.setItem(countryPreferenceKey, region)
      else localStorage.removeItem(countryPreferenceKey)
      localStorage.removeItem(legacyCountryPreferenceKey)
    } catch {
      // Country selection still works for the current search.
    }
  }

  return [country ?? suggestedCountry, changeCountry]
}
