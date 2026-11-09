// Edit mode: a bottom sheet with a slider and −/+ per size, drag handles on the preview, Save / Copy / presets.
import { h, toast } from './dom'
import { DEFAULTS, GROUPS, SPECS, clamp, warningFor, type Group, type SizeKey, type Sizes } from './sizes'
import { BUILT_INS, matchBuiltIn, type BuiltIn } from './presets'
import { exportText, loadPreset, saveCurrent, savePreset, toHash, type Preset } from './store'

type Mode = 'view' | 'edit'

/** Drag handles: which anchor they sit on, the size they change, and the drag direction. */
const HANDLES: readonly { anchor: string; key: SizeKey; axis: 'x' | 'y'; sign: 1 | -1 }[] = [
  { anchor: 'rail', key: 'rail', axis: 'x', sign: 1 },
  { anchor: 'row', key: 'rowH', axis: 'y', sign: 1 },
  { anchor: 'pitch', key: 'pitch', axis: 'x', sign: -1 },
  { anchor: 'head', key: 'head', axis: 'y', sign: 1 },
]

export class Editor {
  private mode: Mode = 'view'
  private group: Group = 'Rows'
  private collapsed = false
  private readonly sheet = h('section', { class: 'sheet', 'aria-label': 'Sizes' })
  private readonly body = h('div', { class: 'sheet__body' })
  private readonly fab = h('button', { class: 'fab', type: 'button' }, '✎ Edit')
  private readonly switches = [this.builtInSwitch(), this.builtInSwitch()]
  private readonly handles = HANDLES.map((d) => ({ ...d, el: h('div', { class: `handle handle--${d.axis}`, 'aria-hidden': 'true' }, h('b')) }))

  constructor(private readonly root: HTMLElement, private values: Sizes, private readonly onChange: (v: Sizes) => void) {
    this.fab.addEventListener('click', () => this.setMode('edit'))
    this.buildSheet()
    root.append(h('div', { class: 'fabbar' }, this.switches[0], this.fab), this.sheet, ...this.handles.map((d) => d.el))
    this.handles.forEach((d) => this.wireHandle(d))
    new ResizeObserver(() => this.placeHandles()).observe(root)
    root.querySelector('.panel')!.addEventListener('scroll', () => this.placeHandles(), { passive: true })
    this.setMode(new URLSearchParams(location.search).get('mode') === 'edit' ? 'edit' : 'view')
  }

  private setMode(mode: Mode): void {
    this.mode = mode
    this.root.dataset.mode = mode
    this.root.dataset.sheet = this.collapsed ? 'min' : 'open'
    this.placeHandles()
  }

  private set(next: Sizes): void {
    this.values = next
    this.onChange(next)
    this.renderControls()
    requestAnimationFrame(() => this.placeHandles())
  }

  private setOne(key: SizeKey, v: number): void {
    if (this.values[key] !== clamp(key, v)) this.set({ ...this.values, [key]: clamp(key, v) })
  }

  private buildSheet(): void {
    const btn = (label: string, run: () => void, cls = '') => {
      const b = h('button', { class: `sbtn ${cls}`, type: 'button' }, label)
      b.addEventListener('click', run)
      return b
    }
    const grip = btn('', () => { this.collapsed = !this.collapsed; this.setMode(this.mode) }, 'grip')
    grip.setAttribute('aria-label', 'Collapse or expand')
    const top = h('div', { class: 'sheet__top' },
      grip,
      btn('View', () => this.setMode('view')),
      btn('Save', () => this.save(), 'primary'),
      btn('Copy values', () => void this.copy(exportText(this.values))),
      btn('Reset', () => { this.set({ ...DEFAULTS }); toast('Back to your values, Mine (not saved yet)') }))
    const tabs = h('div', { class: 'sheet__tabs', role: 'tablist' }, ...GROUPS.map((g) => {
      const b = btn(g, () => { this.group = g; this.renderControls() }, 'tabbtn')
      b.dataset.group = g
      return b
    }))
    const presets = h('div', { class: 'sheet__presets' }, this.switches[1], ...(['A', 'B'] as const).flatMap((p) => [
      btn(`Save as ${p}`, () => this.savePreset(p)),
      btn(`Load ${p}`, () => this.loadPreset(p)),
    ]), btn('Copy A+B', () => this.copyBoth()))
    this.sheet.append(top, tabs, this.body, presets)
    this.renderControls()
  }

  /** One tap to flip between Mine, Suggested and C1 (not saved until Save). */
  private builtInSwitch(): HTMLElement {
    const group = h('div', { class: 'presetsw', role: 'group', 'aria-label': 'Built-in sizes' })
    for (const name of Object.keys(BUILT_INS) as BuiltIn[]) {
      const b = h('button', { type: 'button', 'data-preset': name }, name)
      b.addEventListener('click', () => { this.set({ ...BUILT_INS[name] }); toast(`Showing ${name}`) })
      group.append(b)
    }
    return group
  }

  private renderControls(): void {
    const match = matchBuiltIn(this.values)
    for (const b of this.switches.flatMap((g) => [...g.querySelectorAll<HTMLElement>('[data-preset]')])) b.classList.toggle('on', b.dataset.preset === match)
    for (const b of this.sheet.querySelectorAll<HTMLElement>('.tabbtn')) b.classList.toggle('on', b.dataset.group === this.group)
    const rows = SPECS.filter((s) => s.group === this.group).map((s) => {
      const v = this.values[s.key]
      const warn = warningFor(s.key, v)
      const slider = h('input', { type: 'range', min: s.min, max: s.max, step: 1, value: v, 'aria-label': s.label })
      slider.addEventListener('input', () => this.setOne(s.key, Number(slider.value)))
      const minus = h('button', { class: 'pm', type: 'button', 'aria-label': `Less ${s.label}` }, '−')
      const plus = h('button', { class: 'pm', type: 'button', 'aria-label': `More ${s.label}` }, '+')
      minus.addEventListener('click', () => this.setOne(s.key, v - 1))
      plus.addEventListener('click', () => this.setOne(s.key, v + 1))
      const changed = v !== s.def
      return h('div', { class: `ctlrow${warn ? ' warn' : ''}` },
        h('div', { class: 'ctlrow__label' }, s.label, h('span', { class: 'ctlrow__def' }, changed ? `C1 ${s.def}` : ''), warn ? h('span', { class: 'ctlrow__warn' }, `⚠ ${warn}`) : ''),
        minus, slider, plus, h('output', { class: changed ? 'changed' : '' }, `${v} px`))
    })
    this.body.replaceChildren(...rows)
    const nWarn = SPECS.filter((s) => warningFor(s.key, this.values[s.key])).length
    this.root.dataset.warn = String(nWarn)
  }

  private save(): void {
    saveCurrent(this.values)
    history.replaceState(null, '', toHash(this.values))
    void this.copy(exportText(this.values), 'Saved on this phone + copied. Paste it in chat.')
  }

  private savePreset(p: Preset): void {
    savePreset(p, this.values)
    toast(`Saved as ${p}`)
  }

  private loadPreset(p: Preset): void {
    const v = loadPreset(p)
    if (!v) return toast(`Nothing saved as ${p} yet`)
    this.set(v)
    toast(`Showing ${p}`)
  }

  private copyBoth(): void {
    const parts = (['A', 'B'] as const).map((p) => { const v = loadPreset(p); return v ? exportText(v, p) : null }).filter(Boolean)
    if (!parts.length) return toast('Save A or B first')
    void this.copy(parts.join('\n\n'))
  }

  /** Clipboard first, then the Android share sheet, then a selectable box as the last resort. */
  private async copy(text: string, done = 'Copied. Paste it in chat.'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      return toast(done, 2600)
    } catch { /* fall through */ }
    try {
      if (navigator.share) { await navigator.share({ title: 'SoW sizes', text }); return }
    } catch { /* fall through */ }
    const box = h('textarea', { class: 'copybox', readonly: true }, text)
    const close = h('button', { class: 'sbtn', type: 'button' }, 'Close')
    const modal = h('div', { class: 'modal' }, h('p', {}, 'Select all and copy:'), box, close)
    close.addEventListener('click', () => modal.remove())
    this.root.append(modal)
    box.select()
  }

  private wireHandle(d: (typeof this.handles)[number]): void {
    let active: number | null = null
    let start = 0
    let base = 0
    const label = d.el.querySelector('b')!
    d.el.addEventListener('pointerdown', (e) => {
      active = e.pointerId
      d.el.setPointerCapture?.(e.pointerId)
      start = d.axis === 'x' ? e.clientX : e.clientY
      base = this.values[d.key]
      d.el.classList.add('drag')
    })
    d.el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== active) return
      // Column boundary moves once per shown column, so share the finger travel between them.
      const per = d.key === 'pitch' ? this.root.querySelectorAll('.tab').length : 1
      const delta = ((d.axis === 'x' ? e.clientX : e.clientY) - start) / per
      this.setOne(d.key, base + d.sign * delta)
      label.textContent = `${this.values[d.key]} px`
    })
    const end = (e: PointerEvent) => {
      if (e.pointerId !== active) return
      active = null
      d.el.classList.remove('drag')
      label.textContent = ''
    }
    d.el.addEventListener('pointerup', end)
    d.el.addEventListener('pointercancel', end)
  }

  /** Handles sit on the edge they resize: rail right edge, first row bottom, column boundary, header bottom. */
  private placeHandles(): void {
    if (this.mode !== 'edit') return
    for (const d of this.handles) {
      const a = this.root.querySelector<HTMLElement>(`[data-anchor="${d.anchor}"]`)
      const r = a?.getBoundingClientRect()
      const panel = this.root.querySelector('.panel')!.getBoundingClientRect()
      const head = this.root.querySelector('.head')!.getBoundingClientRect()
      const hidden = !r || (d.anchor === 'row' && (r.bottom < head.bottom || r.bottom > panel.bottom))
      d.el.hidden = hidden
      if (!r || hidden) continue
      const s = d.el.style
      if (d.anchor === 'rail') Object.assign(s, { left: `${r.right}px`, top: `${r.top + r.height / 2}px` })
      if (d.anchor === 'pitch') Object.assign(s, { left: `${r.left}px`, top: `${r.top + r.height / 2}px` })
      if (d.anchor === 'row') Object.assign(s, { left: `${r.left + r.width * 0.42}px`, top: `${r.bottom}px` })
      if (d.anchor === 'head') Object.assign(s, { left: `${r.left + r.width * 0.2}px`, top: `${r.bottom}px` })
    }
  }
}
