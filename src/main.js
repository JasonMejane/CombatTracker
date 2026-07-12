import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { hideSplash } from './lib/splash.js'

const app = mount(App, {
  target: document.getElementById('app'),
})

hideSplash(document.getElementById('splash'))

export default app
