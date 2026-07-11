const STORAGE_KEY = 'combat-tracker-state'

function defaultState() {
  return { creatures: [], activeCreatureId: null }
}

function normalizeCreature(creature) {
  return { conditions: [], tempHp: 0, ...creature }
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
