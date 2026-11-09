// Built-in presets, one tap each. "Mine" is the default; the others are overrides on top of it.
import { DEFAULTS, type Sizes } from './sizes'

export type BuiltIn = 'Mine' | 'Suggested' | 'C1'

/** Design fixes for "something feels off" (see README, Suggested). */
const SUGGESTED: Partial<Sizes> = {
  rail: 28, railGap: 4, railText: 13, panelR: 12, tabR: 10,
  inset: 6, rollW: 24, endGap: 4,
  rowH: 46, box: 30, pitch: 56,
  countText: 15, chipH: 26, chipW: 48, chipText: 13,
}

/** The first mock (C1 + roll column + 48 px rows), kept for comparison. */
const C1: Partial<Sizes> = {
  rail: 32, railGap: 4, edge: 8, panelR: 20, railText: 13, rowH: 48, inset: 8, rollW: 28, nameText: 15,
  box: 32, pitch: 56, endGap: 4, head: 92, headMin: 32, collapseDist: 60, countText: 17, chipH: 28, chipW: 52,
  chipText: 13, tabR: 16, bar: 44,
}

export const BUILT_INS: Readonly<Record<BuiltIn, Sizes>> = {
  Mine: { ...DEFAULTS },
  Suggested: { ...DEFAULTS, ...SUGGESTED },
  C1: { ...DEFAULTS, ...C1 },
}

/** Which built-in the values match exactly, if any (for highlighting the switcher). */
export const matchBuiltIn = (v: Sizes): BuiltIn | null =>
  (Object.keys(BUILT_INS) as BuiltIn[]).find((k) => (Object.keys(v) as (keyof Sizes)[]).every((s) => BUILT_INS[k][s] === v[s])) ?? null
