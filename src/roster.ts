// Demo class: fake names only. Roll numbers follow alphabetical order, as on the class register.
const NAMES = [
  'Aarav Fenwick', 'Ana Ndlovu', 'Bela Thorne', 'Dev Okafor', 'Esha Varne', 'Fatima Corran', 'Hiro Lund', 'Ishaan Okonkwo',
  'Kabir Sol', 'Lia Brightwater', 'Mira Joon', 'Mohammed Asha', 'Nathaniel Vik', 'Omar Quintana', 'Priya Halden', 'Ruhi Imran',
  'Sienna Maddox', 'Tobias Wexley', 'Uma Castell', 'Vihaan Roe', 'Wren Abara', 'Yusuf Penn', 'Zara Ellery', 'Zoya Anand',
] as const

export interface Pupil { readonly roll: number; readonly name: string }
export interface Session { readonly id: string; readonly day: string; readonly date: string; readonly old: boolean }

export const PUPILS: readonly Pupil[] = NAMES.map((name, i) => ({ roll: i + 1, name }))

/** Oldest first; the last one is today. */
export const SESSIONS: readonly Session[] = [
  { id: 's-mon', day: 'Mon', date: '2', old: true },
  { id: 's-wed', day: 'Wed', date: '4', old: false },
]

/** A believable starting state: most done on Monday, about half today. */
export function initialTicks(): Set<string> {
  const on = new Set<string>()
  PUPILS.forEach((p) => {
    if (p.roll % 7 !== 3) on.add(tickId(SESSIONS[0].id, p.roll))
    if (p.roll % 2 === 1 || p.roll % 5 === 0) on.add(tickId(SESSIONS[1].id, p.roll))
  })
  return on
}

export const tickId = (session: string, roll: number): string => `${session}:${roll}`
