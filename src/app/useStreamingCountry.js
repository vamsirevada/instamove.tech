'use client'

import { createContext, useContext, useState, useSyncExternalStore } from 'react'
import countries from './streaming-countries.json'
import timeZoneCountries from './streaming-timezones.json'

const StreamingGeoContext = createContext(null)
const countryPreferenceKey = 'instamovie_streaming_country'
export const countryCodes = new Set(countries.map(({ code }) => code))

export function StreamingCountryProvider({ geoCountry, children }) {
  const code = geoCountry?.trim().toUpperCase()
  const country = countryCodes.has(code) ? code : null
  return <StreamingGeoContext.Provider value={country}>{children}</StreamingGeoContext.Provider>
}

function detectUserCountry(geoCountry) {
  try {
    const saved = localStorage.getItem(countryPreferenceKey)
    if (countryCodes.has(saved)) return saved
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
      if (region) localStorage.setItem(countryPreferenceKey, region)
      else localStorage.removeItem(countryPreferenceKey)
    } catch {
      // Country selection still works for the current search.
    }
  }

  return [country ?? suggestedCountry, changeCountry]
}
