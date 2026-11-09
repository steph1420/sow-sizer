import './vendor/driftline-tokens.css'
import './styles/app.css'
import './styles/editor.css'
import { Checklist } from './checklist'
import { HeaderCollapse } from './collapse'
import { Editor } from './editor'
import { applySizes, type Sizes } from './sizes'
import { loadInitial } from './store'

const root = document.getElementById('app')!
let collapse: HeaderCollapse | null = null
const apply = (v: Sizes) => {
  applySizes(document.documentElement, v)
  collapse?.setDistance(v.collapseDist)
}

const initial = loadInitial()
applySizes(document.documentElement, initial)
const list = new Checklist(root, () => collapse?.schedule())
collapse = new HeaderCollapse(list.scroller)
collapse.setDistance(initial.collapseDist)
new Editor(root, initial, apply)
