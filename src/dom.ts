// Tiny DOM helpers shared by the checklist and the editor.
type Attrs = Record<string, string | number | boolean | undefined>

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...kids: (Node | string)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue
    if (k === 'class') el.className = String(v)
    else el.setAttribute(k, v === true ? '' : String(v))
  }
  el.append(...kids)
  return el
}

let toastTimer = 0
export function toast(text: string, ms = 1800): void {
  const el = document.getElementById('toast')!
  el.textContent = text
  el.classList.add('on')
  clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => el.classList.remove('on'), ms)
}
