// Collapsing header, scrubbed 1:1 with the list's scroll position (expands only back near the very top).
// Where the browser has scroll-driven animations (Chromium 115+, so Brave on Android) the transforms run on the
// compositor from CSS (app.css, @supports). Elsewhere one rAF per frame writes --p (0 → 1) on the header.
const SCROLL_TIMELINE = CSS.supports('animation-timeline: scroll()')

export class HeaderCollapse {
  private distance = 1
  private frame = 0

  constructor(private readonly scroller: HTMLElement) {
    scroller.addEventListener('scroll', () => this.schedule(), { passive: true })
  }

  /** Scroll px over which the header goes from full to thin. */
  setDistance(px: number): void {
    this.distance = Math.max(1, px)
    this.schedule()
  }

  schedule(): void {
    if (!this.frame) this.frame = requestAnimationFrame(() => this.update())
  }

  /** One read (scrollTop) then writes only: no layout thrash. */
  private update(): void {
    this.frame = 0
    const head = this.scroller.querySelector<HTMLElement>('.head')
    if (!head) return
    const p = Math.min(1, Math.max(0, this.scroller.scrollTop / this.distance))
    if (!SCROLL_TIMELINE) head.style.setProperty('--p', p.toFixed(4))
    // Hit areas swap halfway: the big count taps when open, the thin pills when collapsed.
    head.classList.toggle('collapsed', p > 0.5)
  }
}
