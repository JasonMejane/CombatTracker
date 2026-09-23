/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {{ creatures: Creature[], activeCreatureId: string | null, round: number }} EncounterState
 */

const STORAGE_KEY = 'combat-tracker-state'
const CATALOG_KEY = 'combat-tracker-catalog'
const PREFS_KEY = 'combat-tracker-prefs'

/** @returns {EncounterState} */
function defaultState() {
  return { creatures: [], activeCreatureId: null, round: 1 }
}

/**
 * Backfills fields missing from older saved creatures. Input is untrusted JSON.
 * @param {any} creature
 * @returns {Creature}
 */
function normalizeCreature(creature) {
  return { conditions: [], tempHp: 0, ca: 10, ...creature }
}

/** @returns {EncounterState} */
export function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultState()
  try {
    const { creatures, activeCreatureId, round = 1 } = JSON.parse(raw)
    return { creatures: creatures.map(normalizeCreature), activeCreatureId, round }
  } catch {
    return defaultState()
  }
}

/**
 * @param {EncounterState} state
 */
export function saveState({ creatures, activeCreatureId, round }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ creatures, activeCreatureId, round }))
}

/** @returns {Creature[]} */
export function loadCatalog() {
  const raw = localStorage.getItem(CATALOG_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw).map(normalizeCreature)
  } catch {
    return []
  }
}

/**
 * @param {Creature[]} creatures
 */
export function saveCatalog(creatures) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(creatures))
}

/**
 * @typedef {{ keepAwake: boolean }} Prefs
 */

/** @type {Prefs} */
const DEFAULT_PREFS = { keepAwake: true }

/** @returns {Prefs} */
export function loadPrefs() {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

/**
 * @param {Prefs} prefs
 */
export function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}
