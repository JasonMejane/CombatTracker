/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {{ creatures: Creature[], activeCreatureId: string | null }} EncounterState
 */

const STORAGE_KEY = 'combat-tracker-state'
const CATALOG_KEY = 'combat-tracker-catalog'

/** @returns {EncounterState} */
function defaultState() {
  return { creatures: [], activeCreatureId: null }
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
    const { creatures, activeCreatureId } = JSON.parse(raw)
    return { creatures: creatures.map(normalizeCreature), activeCreatureId }
  } catch {
    return defaultState()
  }
}

/**
 * @param {EncounterState} state
 */
export function saveState({ creatures, activeCreatureId }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ creatures, activeCreatureId }))
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
