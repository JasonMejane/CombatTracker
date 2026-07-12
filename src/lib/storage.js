const STORAGE_KEY = 'combat-tracker-state'
const CATALOG_KEY = 'combat-tracker-catalog'

function defaultState() {
  return { creatures: [], activeCreatureId: null }
}

function normalizeCreature(creature) {
  return { conditions: [], tempHp: 0, ca: 10, ...creature }
}

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

export function saveState({ creatures, activeCreatureId }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ creatures, activeCreatureId }))
}

export function loadCatalog() {
  const raw = localStorage.getItem(CATALOG_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw).map(normalizeCreature)
  } catch {
    return []
  }
}

export function saveCatalog(creatures) {
  localStorage.setItem(CATALOG_KEY, JSON.stringify(creatures))
}
