'use client'

import { useId, useRef, useState } from 'react'
import { Check, ChevronDown, Globe, Search, X } from 'lucide-react'
import countries from './streaming-countries.json'

const worldwide = { code: '', name: 'Worldwide' }
const options = [worldwide, ...countries]
const countriesByCode = new Map(options.map((country) => [country.code, country]))
const shortcuts = new Map([['uk', 'GB'], ['usa', 'US'], ['uae', 'AE'], ['global', '']])
const quickCodes = ['IN', 'US', 'GB', 'CA', 'AU']

function normalize(value) {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim()
}

export function StreamingCountryPicker({ value, onChange }) {
  const id = useId()
  const triggerRef = useRef(null)
  const dialogRef = useRef(null)
  const searchRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = countriesByCode.get(value) ?? worldwide
  const term = normalize(query)
  const exact = shortcuts.has(term)
    ? countriesByCode.get(shortcuts.get(term))
    : options.find(({ code, name }) => code.toLowerCase() === term || normalize(name) === term)
  const quickPicks = [...new Set(['', value, ...quickCodes])].map((code) => countriesByCode.get(code)).filter(Boolean)
  const allCountries = countries.filter(({ code }) => !quickPicks.some((country) => country.code === code))
  const matches = term
    ? [exact, ...options.filter(({ code, name }) => code.toLowerCase().includes(term) || normalize(name).includes(term))]
        .filter(Boolean)
    : []
  const searchResults = [...new Set(matches)]

  function openPicker() {
    setQuery('')
    dialogRef.current.showModal()
    setOpen(true)
    if (window.matchMedia('(pointer: fine)').matches) searchRef.current.focus()
  }

  function selectCountry(code) {
    onChange(code)
    dialogRef.current.close()
  }

  function onSearchKeyDown(event) {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      listRef.current.querySelector('button')?.focus()
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (term && searchResults.length) selectCountry(searchResults[0].code)
    }
  }

  function onListKeyDown(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const buttons = Array.from(listRef.current.querySelectorAll('button'))
    const index = buttons.indexOf(event.target)
    if (index === -1) return
    event.preventDefault()
    if (event.key === 'ArrowUp' && index === 0) {
      searchRef.current.focus()
    } else {
      buttons[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus()
    }
  }

  function renderOptions(items, label) {
    return (
      <div>
        {label && <h3 className="px-3 pb-1 pt-2 text-xs font-semibold text-muted-foreground">{label}</h3>}
        <ul>
          {items.map(({ code, name }) => (
            <li key={code}>
              <button
                type="button"
                aria-pressed={code === value}
                onClick={() => selectCountry(code)}
                className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-violet-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-violet-600 aria-pressed:bg-violet-50 aria-pressed:text-violet-900"
              >
                {!code && <Globe aria-hidden="true" className="size-4 shrink-0" />}
                <span className="min-w-0 flex-1 font-medium">{name}</span>
                {code && <span aria-hidden="true" className="text-xs text-muted-foreground">{code}</span>}
                <Check aria-hidden="true" className={`size-4 shrink-0 text-violet-700 ${code === value ? '' : 'invisible'}`} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Streaming country: ${selected.name}`}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        onClick={openPicker}
        className="inline-flex min-h-11 max-w-full min-w-0 cursor-pointer items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-3 text-sm font-medium text-foreground transition-colors hover:border-violet-200 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
      >
        <Globe aria-hidden="true" className="size-4 shrink-0 text-violet-700" />
        <span className="max-w-[min(34vw,12rem)] truncate">{selected.name}</span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      <dialog
        ref={dialogRef}
        id={id}
        aria-labelledby={`${id}-title`}
        onClose={() => {
          setOpen(false)
          triggerRef.current?.focus({ preventScroll: true })
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            dialogRef.current.close()
          }
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current.close()
        }}
        className="fixed inset-x-0 top-auto bottom-0 m-0 mx-auto max-h-none w-full max-w-none overflow-hidden rounded-t-3xl border border-border bg-background text-left text-foreground shadow-2xl backdrop:bg-neutral-950/35 supports-[backdrop-filter]:backdrop:backdrop-blur-[2px] sm:inset-0 sm:m-auto sm:w-[calc(100%-2rem)] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex h-[min(37rem,85dvh)] flex-col motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
          <div className="shrink-0 space-y-3 border-b border-border/70 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id={`${id}-title`} className="text-lg font-bold tracking-tight">Streaming country</h2>
                <p className="mt-1 text-sm text-muted-foreground">See where films stream in your country.</p>
              </div>
              <button type="button" aria-label="Close country picker" onClick={() => dialogRef.current.close()} className="-mt-1 -mr-1 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-violet-600">
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <div className="flex items-center gap-2.5 rounded-xl border border-input px-3 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
              <Search aria-hidden="true" className="size-4 shrink-0 text-violet-700" />
              <input ref={searchRef} type="search" aria-label="Search countries" placeholder="Search countries…" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onSearchKeyDown} className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <div ref={listRef} onKeyDown={onListKeyDown} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
            {open && (term ? (
              searchResults.length ? renderOptions(searchResults) : <p role="status" className="px-3 py-6 text-sm text-muted-foreground">No countries match that search.</p>
            ) : (
              <>
                {renderOptions(quickPicks, 'Quick picks')}
                {renderOptions(allCountries, 'All countries')}
              </>
            ))}
          </div>
        </div>
      </dialog>
    </>
  )
}
