// The Checklist preview: Driftline Night look, fully interactive (ticks, undo/redo, Pending, 1|2 columns, A–Z rail).
import { h, toast } from './dom'
import { PUPILS, SESSIONS, initialTicks, tickId, type Pupil, type Session } from './roster'

type Op = { readonly id: string; readonly on: boolean }
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export class Checklist {
  private ticks = initialTicks()
  private cols: 1 | 2 = 2
  private sel = SESSIONS[SESSIONS.length - 1].id
  private pending = false
  private undoStack: Op[] = []
  private redoStack: Op[] = []

  private readonly panel = h('main', { class: 'panel' })
  private readonly ctl = h('div', { class: 'ctl' })
  private readonly rail = h('nav', { class: 'rail', 'aria-label': 'Jump to letter', 'data-anchor': 'rail' })
  private readonly bubble = h('div', { class: 'bubble', 'aria-hidden': 'true' })

  constructor(private readonly root: HTMLElement) {
    root.append(this.bar(), this.ctl, this.rail, this.panel, this.dock(), this.bubble)
    this.buildRail()
    this.render()
  }

  /** Rebuilds controls, header and rows (used for state changes that alter the structure). */
  render(): void {
    this.renderControls()
    this.root.style.setProperty('--cols', String(this.cols))
    const shown = this.shownSessions()
    const head = h('div', { class: 'head', 'data-anchor': 'head' },
      h('div', { class: 'head__name' }, h('span', { class: 'roll' }, '#'), h('span', { class: 'name' }, 'Name')),
      ...shown.map((s, i) => this.tab(s, i)))
    const pupils = this.pending ? PUPILS.filter((p) => !this.ticks.has(tickId(this.sel, p.roll))) : PUPILS
    const rows = h('div', { class: 'rows' }, ...pupils.map((p) => this.row(p, shown)))
    if (!pupils.length) rows.append(h('p', { class: 'empty' }, 'All done for this date'))
    this.panel.replaceChildren(head, rows)
  }

  private shownSessions(): readonly Session[] {
    return this.cols === 2 ? SESSIONS : SESSIONS.slice(-1)
  }

  private bar(): HTMLElement {
    const pill = h('button', { class: 'class-pill', type: 'button' },
      h('span', { class: 'class-pill__text' }, h('b', {}, 'KG-A'), ' English · HW', h('br'), 'Letters K & L'),
      h('span', { class: 'class-pill__chev', 'aria-hidden': 'true' }, '⌄'), h('i', { class: 'dot', 'aria-hidden': 'true' }))
    const search = h('button', { class: 'ib ring', type: 'button', 'aria-label': 'Search' }, '⌕')
    const more = h('button', { class: 'ib ring', type: 'button', 'aria-label': 'More' }, '⋮')
    for (const b of [pill, search, more]) b.addEventListener('click', () => toast('Mock only: no menus here'))
    return h('header', { class: 'bar' }, pill, search, more)
  }

  private renderControls(): void {
    const pend = h('button', { class: `pend${this.pending ? ' on' : ''}`, type: 'button', 'aria-pressed': this.pending }, 'Pending')
    pend.addEventListener('click', () => { this.pending = !this.pending; this.render() })
    const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Date columns' })
    for (const n of [1, 2] as const) {
      const b = h('button', { class: n === this.cols ? 'on' : '', type: 'button', 'aria-pressed': n === this.cols }, String(n))
      b.addEventListener('click', () => { this.cols = n; if (n === 1) this.sel = SESSIONS[SESSIONS.length - 1].id; this.render() })
      seg.append(b)
    }
    const undo = h('button', { class: 'ib', type: 'button', 'aria-label': 'Undo', disabled: !this.undoStack.length }, '↶')
    const redo = h('button', { class: 'ib', type: 'button', 'aria-label': 'Redo', disabled: !this.redoStack.length }, '↷')
    undo.addEventListener('click', () => this.step(this.undoStack, this.redoStack))
    redo.addEventListener('click', () => this.step(this.redoStack, this.undoStack))
    this.ctl.replaceChildren(pend, seg, h('span', { class: 'grow' }), undo, redo)
  }

  private tab(s: Session, i: number): HTMLElement {
    const done = PUPILS.filter((p) => this.ticks.has(tickId(s.id, p.roll))).length
    const tab = h('div', { class: `tab${s.id === this.sel ? ' sel' : ''}${s.old ? ' old' : ''}`, 'data-session': s.id, 'data-anchor': i === 0 ? 'pitch' : undefined },
      h('button', { class: 'tab__n', type: 'button', 'aria-label': `${done} of ${PUPILS.length} done` }, String(done), h('small', {}, `/${PUPILS.length}`)),
      h('button', { class: 'tab__d', type: 'button' }, `${s.day} ${s.date}`))
    tab.addEventListener('click', () => { this.sel = s.id; this.render() })
    return tab
  }

  private row(p: Pupil, shown: readonly Session[]): HTMLElement {
    const name = h('span', { class: 'name' }, p.name)
    name.addEventListener('click', () => toast(`${p.roll}. ${p.name}`))
    const boxes = shown.map((s) => {
      const id = tickId(s.id, p.roll)
      const on = this.ticks.has(id)
      const b = h('button', { class: `t${on ? ' on' : ''}${s.id === this.sel ? ' sel' : ''}`, type: 'button', 'data-tick': id, 'aria-pressed': on, 'aria-label': `${p.name}, ${s.day} ${s.date}` })
      b.addEventListener('click', () => this.toggle(id))
      return b
    })
    return h('div', { class: 'row', 'data-letter': p.name[0], 'data-anchor': p.roll === 1 ? 'row' : undefined },
      h('span', { class: 'roll' }, String(p.roll)), name, ...boxes)
  }

  private toggle(id: string): void {
    const on = !this.ticks.has(id)
    this.apply({ id, on })
    this.undoStack.push({ id, on })
    this.redoStack = []
    this.renderControls()
  }

  private step(from: Op[], to: Op[]): void {
    const op = from.pop()
    if (!op) return
    const back = { id: op.id, on: !op.on }
    this.apply(from === this.undoStack ? back : op)
    to.push(op)
    this.renderControls()
  }

  /** Updates one box and the counts in place, so the list never jumps while ticking. */
  private apply(op: Op): void {
    if (op.on) this.ticks.add(op.id)
    else this.ticks.delete(op.id)
    const box = this.panel.querySelector<HTMLButtonElement>(`[data-tick="${op.id}"]`)
    box?.classList.toggle('on', op.on)
    box?.setAttribute('aria-pressed', String(op.on))
    for (const tab of this.panel.querySelectorAll<HTMLElement>('.tab')) {
      const done = PUPILS.filter((p) => this.ticks.has(tickId(tab.dataset.session!, p.roll))).length
      tab.querySelector('.tab__n')!.firstChild!.textContent = String(done)
    }
  }

  private buildRail(): void {
    const present = new Set(PUPILS.map((p) => p.name[0]))
    this.rail.append(...LETTERS.map((l) => h('span', { class: present.has(l) ? 'on' : '' }, l)))
    const jump = (e: PointerEvent) => {
      const r = this.rail.getBoundingClientRect()
      const i = Math.min(LETTERS.length - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * LETTERS.length)))
      this.jumpTo(LETTERS[i], e.clientY)
    }
    this.rail.addEventListener('pointerdown', (e) => { this.rail.setPointerCapture(e.pointerId); jump(e) })
    this.rail.addEventListener('pointermove', (e) => { if (this.rail.hasPointerCapture(e.pointerId)) jump(e) })
    const end = () => this.bubble.classList.remove('on')
    this.rail.addEventListener('pointerup', end)
    this.rail.addEventListener('pointercancel', end)
  }

  /** Scrolls the first name at or after the letter to just under the sticky header. */
  private jumpTo(letter: string, y: number): void {
    const rows = [...this.panel.querySelectorAll<HTMLElement>('.row')]
    const target = rows.find((r) => r.dataset.letter! >= letter) ?? rows[rows.length - 1]
    if (target) this.panel.scrollTop = target.offsetTop - this.panel.querySelector<HTMLElement>('.head')!.offsetHeight
    this.bubble.textContent = letter
    this.bubble.style.top = `${y}px`
    this.bubble.classList.add('on')
  }

  private dock(): HTMLElement {
    const tabs = [['◎', 'Overview'], ['✓', 'Checklist'], ['⚙', 'Settings']].map(([icon, label]) => {
      const b = h('button', { class: `dock__tab${label === 'Checklist' ? ' on' : ''}`, type: 'button' }, h('span', { class: 'dock__icon', 'aria-hidden': 'true' }, icon), label)
      if (label !== 'Checklist') b.addEventListener('click', () => toast('Mock only: Checklist page'))
      return b
    })
    return h('nav', { class: 'dock', 'aria-label': 'Pages' }, ...tabs)
  }
}
