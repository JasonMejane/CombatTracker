import { createCreature } from './creatures.js'

/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {import('./types.js').CatalogInput} CatalogInput
 */

/**
 * @param {CatalogInput} spec
 * @returns {Creature}
 */
export function createCatalogCreature({ name, hp, isPlayer, ca }) {
  return createCreature({ name, hp, initiative: 1, isPlayer, ca })
}

/**
 * @param {Creature} creature
 * @param {number | string} value
 * @returns {Creature}
 */
export function setBaseHp(creature, value) {
  const hp = Math.max(1, Number(value))
  return { ...creature, currentHp: hp, maxHp: hp }
}

/**
 * @param {Creature[]} creatures
 * @returns {Creature[]}
 */
export function sortByName(creatures) {
  return [...creatures].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/**
 * @param {Creature[]} creatures
 * @param {string} side one of `all` | `player` | `enemy`
 * @returns {Creature[]}
 */
export function filterBySide(creatures, side) {
  if (side === 'player') return creatures.filter((c) => c.isPlayer)
  if (side === 'enemy') return creatures.filter((c) => !c.isPlayer)
  return creatures
}

/**
 * @param {ReadonlyArray<{ name: string, isPlayer: boolean }>} creatures
 * @param {string} name
 * @returns {string}
 */
export function uniqueEnemyName(creatures, name) {
  const taken = new Set(creatures.filter((c) => !c.isPlayer).map((c) => c.name))
  if (!taken.has(name)) return name
  let index = 2
  while (taken.has(`${name} ${index}`)) index++
  return `${name} ${index}`
}

/**
 * @param {Creature} catalogCreature
 * @param {number} initiative
 * @param {string} [name]
 * @returns {Creature}
 */
export function spawnFromCatalog(catalogCreature, initiative, name = catalogCreature.name) {
  const { maxHp, isPlayer, ca } = catalogCreature
  return createCreature({ name, hp: maxHp, initiative, isPlayer, ca })
}
