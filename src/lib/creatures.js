/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {import('./types.js').CreatureInput} CreatureInput
 * @typedef {import('./types.js').DeathSaves} DeathSaves
 */

const MAX_DEATH_SAVES = 3
const DEFAULT_CA = 10
const BLOODIED_RATIO = 0.5
const CRITICAL_RATIO = 0.25
/** @type {DeathSaves} */
const NO_DEATH_SAVES = { successes: 0, failures: 0 }

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
 * Temp HP soaks the hit first. At 0 HP a hit costs a death save; a hit whose
 * excess past 0 reaches max HP kills outright (massive damage).
 * @param {Creature} creature
 * @param {number} amount
 * @returns {Creature}
 */
export function damage(creature, amount) {
  const tempHp = Math.max(0, creature.tempHp - amount)
  const overflow = Math.max(0, amount - creature.tempHp)
  return takeHit({ ...creature, tempHp }, overflow)
}

/**
 * @param {Creature} creature
 * @param {number} overflow damage left after temp HP
 * @returns {Creature}
 */
function takeHit(creature, overflow) {
  if (overflow <= 0) return creature
  if (isDown(creature)) return hitWhileDown(creature, overflow)
  return dropHp(creature, overflow)
}

/**
 * Dropping to 0 HP knocks the creature out, which ends its concentration.
 * @param {Creature} creature
 * @param {number} overflow
 * @returns {Creature}
 */
function dropHp(creature, overflow) {
  const hit = { ...creature, currentHp: Math.max(0, creature.currentHp - overflow) }
  if (!isDown(hit)) return hit
  const knockedOut = { ...hit, conditions: hit.conditions.filter((c) => c !== 'concentration') }
  return overflow - creature.currentHp >= creature.maxHp ? kill(knockedOut) : knockedOut
}

/**
 * @param {Creature} creature
 * @param {number} overflow
 * @returns {Creature}
 */
function hitWhileDown(creature, overflow) {
  if (overflow >= creature.maxHp) return kill(creature)
  const saves = deathState(creature) === 'stable' ? NO_DEATH_SAVES : creature.deathSaves
  return { ...creature, deathSaves: { ...saves, failures: Math.min(MAX_DEATH_SAVES, saves.failures + 1) } }
}

/**
 * @param {Creature} creature
 * @returns {Creature}
 */
function kill(creature) {
  return { ...creature, currentHp: 0, deathSaves: { successes: 0, failures: MAX_DEATH_SAVES } }
}

/**
 * Healing a creature at 0 HP brings it back and clears its death saves.
 * @param {Creature} creature
 * @param {number} amount
 * @returns {Creature}
 */
export function heal(creature, amount) {
  const healed = { ...creature, currentHp: Math.min(creature.maxHp, creature.currentHp + amount) }
  return isDown(creature) && amount > 0 ? { ...healed, deathSaves: { ...NO_DEATH_SAVES } } : healed
}

/**
 * Health band for colouring: bloodied at half HP or less (5e), critical at a quarter.
 * Temporary HP is not counted.
 * @param {Creature} creature
 * @returns {'healthy' | 'bloodied' | 'critical' | 'down'}
 */
export function healthState(creature) {
  if (isDown(creature)) return 'down'
  const ratio = creature.currentHp / Math.max(1, creature.maxHp)
  if (ratio <= CRITICAL_RATIO) return 'critical'
  return ratio <= BLOODIED_RATIO ? 'bloodied' : 'healthy'
}

/**
 * @param {Creature} creature
 * @returns {boolean}
 */
export function isDown(creature) {
  return creature.currentHp <= 0
}

/**
 * @typedef {'success' | 'failure' | 'nat1' | 'nat20'} DeathSaveRoll
 */

/** @type {Record<DeathSaveRoll, (creature: Creature) => Creature>} */
const DEATH_SAVE_ROLLS = {
  success: (c) => bumpDeathSave(c, 'successes', 1),
  failure: (c) => bumpDeathSave(c, 'failures', 1),
  nat1: (c) => bumpDeathSave(c, 'failures', 2),
  nat20: (c) => revive(c),
}

/**
 * @param {Creature} creature
 * @param {DeathSaveRoll} kind a natural 1 counts as two failures; a natural 20 revives at 1 HP
 * @returns {Creature}
 */
export function addDeathSave(creature, kind) {
  return DEATH_SAVE_ROLLS[kind](creature)
}

/**
 * @param {Creature} creature
 * @param {keyof DeathSaves} key
 * @param {number} count
 * @returns {Creature}
 */
function bumpDeathSave(creature, key, count) {
  const next = Math.min(MAX_DEATH_SAVES, creature.deathSaves[key] + count)
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
  return { ...creature, currentHp: 1, deathSaves: { ...NO_DEATH_SAVES } }
}

/**
 * Whether the creature still takes turns: downed enemies and dead players don't.
 * @param {Creature} creature
 * @returns {boolean}
 */
export function canAct(creature) {
  if (!creature.isPlayer) return !isDown(creature)
  return deathState(creature) !== 'dead'
}

/**
 * The next creature in initiative order (wrapping) that can still act.
 * @param {Creature[]} creatures
 * @param {string | null} currentId
 * @returns {string | null}
 */
export function nextActiveId(creatures, currentId) {
  return firstActorAfter(sortByInitiative(creatures), currentId)
}

/**
 * The previous creature in initiative order (wrapping) that can still act.
 * @param {Creature[]} creatures
 * @param {string | null} currentId
 * @returns {string | null}
 */
export function previousActiveId(creatures, currentId) {
  return firstActorAfter(sortByInitiative(creatures).reverse(), currentId)
}

/**
 * @param {Creature[]} ordered
 * @param {string | null} currentId
 * @returns {string | null}
 */
function firstActorAfter(ordered, currentId) {
  const index = ordered.findIndex((c) => c.id === currentId)
  const rotated = [...ordered.slice(index + 1), ...ordered.slice(0, index + 1)]
  return rotated.find(canAct)?.id ?? null
}

/**
 * Removes a creature; if it held the turn, the turn passes to the next one.
 * @param {Creature[]} creatures
 * @param {string | null} activeCreatureId
 * @param {string} id
 * @returns {{ creatures: Creature[], activeCreatureId: string | null }}
 */
export function removeCreature(creatures, activeCreatureId, id) {
  const remaining = creatures.filter((c) => c.id !== id)
  if (activeCreatureId !== id) return { creatures: remaining, activeCreatureId }
  const next = nextActiveId(creatures, id)
  return { creatures: remaining, activeCreatureId: next === id ? null : next }
}

/**
 * @param {Creature} creature
 * @param {string} name blank names are ignored
 * @returns {Creature}
 */
export function rename(creature, name) {
  return { ...creature, name: name.trim() || creature.name }
}

/**
 * Raising max HP does not heal; lowering it caps current HP.
 * @param {Creature} creature
 * @param {number | string} value
 * @returns {Creature}
 */
export function setMaxHp(creature, value) {
  const maxHp = Math.max(1, Number(value))
  return { ...creature, maxHp, currentHp: Math.min(creature.currentHp, maxHp) }
}
