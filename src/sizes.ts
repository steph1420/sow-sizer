// Every adjustable size on the Checklist, in CSS px. Defaults = C1 plan + roll column + 48 px rows.
export type Group = 'Layout' | 'Rows' | 'Columns' | 'Header' | 'Chrome'

/** text: warn under 13 px. tap: warn when the tap it produces is under 44 px. */
type Kind = 'len' | 'text' | 'tap'

export interface SizeSpec {
  readonly key: string
  readonly label: string
  readonly group: Group
  readonly def: number
  readonly min: number
  readonly max: number
  readonly kind: Kind
  /** For taps whose hit area is not the value itself (e.g. dock tab = dock − 8). */
  readonly tapOf?: (v: number) => number
}

export const MIN_TEXT = 13
export const MIN_TAP = 44

export const SPECS = [
  { key: 'rail', label: 'Rail width', group: 'Layout', def: 32, min: 16, max: 56, kind: 'len' },
  { key: 'railGap', label: 'Rail → panel gap', group: 'Layout', def: 4, min: 0, max: 24, kind: 'len' },
  { key: 'edge', label: 'Panel side margin', group: 'Layout', def: 8, min: 0, max: 24, kind: 'len' },
  { key: 'panelR', label: 'Panel corner radius', group: 'Layout', def: 20, min: 0, max: 32, kind: 'len' },
  { key: 'railText', label: 'Rail letter size', group: 'Layout', def: 13, min: 10, max: 18, kind: 'text' },
  { key: 'rowH', label: 'Row height', group: 'Rows', def: 48, min: 32, max: 72, kind: 'tap' },
  { key: 'rowGap', label: 'Row gap (0 = lines, >0 = cards)', group: 'Rows', def: 0, min: 0, max: 12, kind: 'len' },
  { key: 'inset', label: 'Inset before roll #', group: 'Rows', def: 8, min: 0, max: 32, kind: 'len' },
  { key: 'rollW', label: 'Roll # column width', group: 'Rows', def: 28, min: 16, max: 56, kind: 'len' },
  { key: 'rollText', label: 'Roll # text size', group: 'Rows', def: 13, min: 10, max: 20, kind: 'text' },
  { key: 'nameGap', label: 'Roll # → name gap', group: 'Rows', def: 6, min: 0, max: 24, kind: 'len' },
  { key: 'nameText', label: 'Name text size', group: 'Rows', def: 15, min: 11, max: 22, kind: 'text' },
  { key: 'box', label: 'Tick box size', group: 'Columns', def: 32, min: 20, max: 48, kind: 'len' },
  { key: 'pitch', label: 'Column pitch', group: 'Columns', def: 56, min: 36, max: 80, kind: 'tap' },
  { key: 'endGap', label: 'Gap after last column', group: 'Columns', def: 4, min: 0, max: 24, kind: 'len' },
  { key: 'head', label: 'Header height', group: 'Header', def: 92, min: 56, max: 140, kind: 'len' },
  { key: 'countText', label: 'Count text size', group: 'Header', def: 17, min: 12, max: 28, kind: 'text' },
  { key: 'chipH', label: 'Date chip height', group: 'Header', def: 28, min: 20, max: 44, kind: 'len' },
  { key: 'chipW', label: 'Date chip width (max)', group: 'Header', def: 52, min: 36, max: 80, kind: 'len' },
  { key: 'chipText', label: 'Date chip text size', group: 'Header', def: 13, min: 10, max: 18, kind: 'text' },
  { key: 'tabR', label: 'Tab corner radius', group: 'Header', def: 16, min: 0, max: 32, kind: 'len' },
  { key: 'bar', label: 'Class bar height', group: 'Chrome', def: 44, min: 36, max: 64, kind: 'tap' },
  { key: 'ctl', label: 'Controls row height', group: 'Chrome', def: 44, min: 36, max: 64, kind: 'tap' },
  { key: 'dock', label: 'Dock height', group: 'Chrome', def: 52, min: 40, max: 72, kind: 'tap', tapOf: (v) => v - 8 },
] as const satisfies readonly SizeSpec[]

export type SizeKey = (typeof SPECS)[number]['key']
export type Sizes = Record<SizeKey, number>
export const GROUPS: readonly Group[] = ['Layout', 'Rows', 'Columns', 'Header', 'Chrome']

export const DEFAULTS: Sizes = Object.fromEntries(SPECS.map((s) => [s.key, s.def])) as Sizes
const BY_KEY = new Map<string, SizeSpec>(SPECS.map((s) => [s.key, s]))

export const specOf = (key: SizeKey): SizeSpec => BY_KEY.get(key)!
export const clamp = (key: SizeKey, v: number): number => {
  const s = specOf(key)
  return Math.min(s.max, Math.max(s.min, Math.round(v)))
}

/** Unknown keys are dropped, missing ones fall back to the default, out-of-range values are clamped. */
export function sanitize(raw: unknown): Sizes {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const out = { ...DEFAULTS }
  for (const s of SPECS) {
    const v = Number(src[s.key])
    if (Number.isFinite(v)) out[s.key] = clamp(s.key, v)
  }
  return out
}

/** A short reason when a value breaks the 13 px text / 44 px tap rules, else null. */
export function warningFor(key: SizeKey, v: number): string | null {
  const s = specOf(key)
  if (s.kind === 'text' && v < MIN_TEXT) return `Text under ${MIN_TEXT} px`
  if (s.kind === 'tap') {
    const tap = s.tapOf ? s.tapOf(v) : v
    if (tap < MIN_TAP) return `Tap ${tap} px, under ${MIN_TAP}`
  }
  return null
}

export function applySizes(root: HTMLElement, v: Sizes): void {
  for (const s of SPECS) root.style.setProperty(`--s-${s.key}`, `${v[s.key]}px`)
  root.dataset.rows = v.rowGap > 0 ? 'cards' : 'lines'
}
