import './vendor/driftline-tokens.css'
import './styles/app.css'
import './styles/editor.css'
import { Checklist } from './checklist'
import { Editor } from './editor'
import { applySizes } from './sizes'
import { loadInitial } from './store'

const root = document.getElementById('app')!
const initial = loadInitial()
applySizes(document.documentElement, initial)
new Checklist(root)
new Editor(root, initial, (v) => applySizes(document.documentElement, v))
