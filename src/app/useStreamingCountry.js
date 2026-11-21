'use client'

import { useState, useSyncExternalStore } from 'react'
import countries from './streaming-countries.json'

const countryPreferenceKey = 'instamovie_streaming_country'
export const countryCodes = new Set(countries.map(({ code }) => code))

function readCountryPreference() {
  try {
    const saved = localStorage.getItem(countryPreferenceKey)
    if (saved === '' || countryCodes.has(saved)) return saved
  } catch {
    // Country selection still works for the current search.
  }

  for (const locale of navigator.languages) {
    const region = new Intl.Locale(locale).region
    if (countryCodes.has(region)) return region
  }

  return ''
}

function subscribeToCountryPreference(callback) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function readServerCountryPreference() {
  return ''
}

export function useStreamingCountry(initialCountry = null) {
  const [country, setCountry] = useState(initialCountry)
  const suggestedCountry = useSyncExternalStore(
    subscribeToCountryPreference,
    readCountryPreference,
    readServerCountryPreference
  )

  function changeCountry(region) {
    setCountry(region)
    try {
      localStorage.setItem(countryPreferenceKey, region)
    } catch {
      // Country selection still works for the current search.
    }
  }

  return [country ?? suggestedCountry, changeCountry]
}
