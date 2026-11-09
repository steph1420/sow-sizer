// Persistence: localStorage (current + presets A/B), a URL hash that restores the values, and a copyable export.
import { DEFAULTS, SPECS, sanitize, type Sizes } from './sizes'

export type Preset = 'A' | 'B'
const NS = 'sow-sizer'
const VERSION = 1
const key = (name: string) => `${NS}:${name}:v${VERSION}`
const HASH_PREFIX = `#v${VERSION}:`

function read(name: string): Sizes | null {
  try {
    const raw = localStorage.getItem(key(name))
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
const write = (name: string, v: Sizes) => localStorage.setItem(key(name), JSON.stringify(v))

export const loadPreset = (p: Preset): Sizes | null => read(`preset-${p}`)
export const savePreset = (p: Preset, v: Sizes): void => write(`preset-${p}`, v)
export const saveCurrent = (v: Sizes): void => write('current', v)

/** URL hash wins (a shared link), then the last saved values, then the defaults. */
export function loadInitial(): Sizes {
  return fromHash(location.hash) ?? read('current') ?? { ...DEFAULTS }
}

/** `#v1:rail=32,railGap=4,…` — every value, so the link stays exact even if defaults change later. */
export const toHash = (v: Sizes): string => HASH_PREFIX + SPECS.map((s) => `${s.key}=${v[s.key]}`).join(',')

export function fromHash(hash: string): Sizes | null {
  if (!hash.startsWith(HASH_PREFIX)) return null
  const pairs = hash.slice(HASH_PREFIX.length).split(',').map((p) => p.split('='))
  return sanitize(Object.fromEntries(pairs))
}

export const shareUrl = (v: Sizes): string => `${location.origin}${location.pathname}${toHash(v)}`

/** What Steve pastes into chat: one header line, one JSON line, one restore link. */
export function exportText(v: Sizes, label = 'current'): string {
  const viewport = `${innerWidth}x${innerHeight}@${devicePixelRatio.toFixed(4)}`
  const json = JSON.stringify({ sizer: VERSION, preset: label, viewport, values: v })
  return `SoW sizer v${VERSION} (CSS px)\n${json}\n${shareUrl(v)}`
}
