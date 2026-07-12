/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {import('./types.js').CreatureInput} CreatureInput
 * @typedef {import('./types.js').DeathSaves} DeathSaves
 */

const MAX_DEATH_SAVES = 3
const DEFAULT_CA = 10

/**
 * @param {CreatureInput} spec
 * @returns {Creature}
 */
export function createCreature({ name, hp, maxHp, initiative, isPlayer, ca }) {
  return {
    id: crypto.randomUUID(),
    name,
    maxHp: maxHp ?? hp,
    currentHp: hp,
    initiative,
    isPlayer,
    ca: ca ?? DEFAULT_CA,
    deathSaves: { successes: 0, failures: 0 },
    conditions: [],
    tempHp: 0,
  }
}

/**
 * @param {Creature} creature
 * @param {number} value
 * @returns {Creature}
 */
export function setTempHp(creature, value) {
  return { ...creature, tempHp: Math.max(0, value) }
}

/**
 * @param {Creature} creature
 * @param {number} amount
 * @returns {Creature}
 */
export function addTempHp(creature, amount) {
  return setTempHp(creature, creature.tempHp + amount)
}

/**
 * @param {Creature} creature
 * @param {number | string} value
 * @returns {Creature}
 */
export function setInitiative(creature, value) {
  return { ...creature, initiative: Number(value) }
}

/**
 * @param {Creature} creature
 * @param {number | string} value
 * @returns {Creature}
 */
export function setCa(creature, value) {
  return { ...creature, ca: Number(value) }
}

/**
 * @param {Creature} creature
 * @param {string} key
 * @returns {Creature}
 */
export function toggleCondition(creature, key) {
  const has = creature.conditions.includes(key)
  const conditions = has ? creature.conditions.filter((c) => c !== key) : [...creature.conditions, key]
  return { ...creature, conditions }
}

/**
 * @param {Creature[]} creatures
 * @returns {Creature[]}
 */
export function sortByInitiative(creatures) {
  return [...creatures].sort(compareForOrder)
}

/**
 * @param {Creature} a
 * @param {Creature} b
 * @returns {number}
 */
function compareForOrder(a, b) {
  if (a.initiative !== b.initiative) return b.initiative - a.initiative
  return Number(b.isPlayer) - Number(a.isPlayer)
}

/**
 * @param {Creature} creature
 * @param {number} amount
 * @returns {Creature}
 */
export function damage(creature, amount) {
  const tempHp = Math.max(0, creature.tempHp - amount)
  const overflow = Math.max(0, amount - creature.tempHp)
  return { ...creature, tempHp, currentHp: Math.max(0, creature.currentHp - overflow) }
}

/**
 * @param {Creature} creature
 * @param {number} amount
 * @returns {Creature}
 */
export function heal(creature, amount) {
  return { ...creature, currentHp: Math.min(creature.maxHp, creature.currentHp + amount) }
}

/**
 * @param {Creature} creature
 * @returns {boolean}
 */
export function isDown(creature) {
  return creature.currentHp <= 0
}

/**
 * @param {Creature} creature
 * @param {'success' | 'failure'} kind
 * @returns {Creature}
 */
export function addDeathSave(creature, kind) {
  const key = kind === 'success' ? 'successes' : 'failures'
  const next = Math.min(MAX_DEATH_SAVES, creature.deathSaves[key] + 1)
  return { ...creature, deathSaves: { ...creature.deathSaves, [key]: next } }
}

/**
 * @param {Creature} creature
 * @returns {'alive' | 'dead' | 'stable' | 'dying'}
 */
export function deathState(creature) {
  if (!isDown(creature)) return 'alive'
  if (creature.deathSaves.failures >= MAX_DEATH_SAVES) return 'dead'
  if (creature.deathSaves.successes >= MAX_DEATH_SAVES) return 'stable'
  return 'dying'
}

/**
 * @param {Creature} creature
 * @returns {Creature}
 */
export function revive(creature) {
  return { ...creature, currentHp: 1, deathSaves: { successes: 0, failures: 0 } }
}

/**
 * @param {Creature[]} creatures
 * @param {string | null} currentId
 * @returns {string | null}
 */
export function nextActiveId(creatures, currentId) {
  const ordered = sortByInitiative(creatures)
  if (ordered.length === 0) return null
  const index = ordered.findIndex((c) => c.id === currentId)
  return ordered[(index + 1) % ordered.length].id
}
