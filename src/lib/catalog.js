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

/**
 * @param {Creature[]} creatures
 * @param {string} query case-insensitive substring of the name; blank matches all
 * @returns {Creature[]}
 */
export function filterByName(creatures, query) {
  const needle = query.trim().toLowerCase()
  return creatures.filter((c) => c.name.toLowerCase().includes(needle))
}

/**
 * Spawns `count` fresh copies sharing one initiative; enemy copies get unique
 * numbered names ("Goblin 2", "Goblin 3"…), a player is always sent once.
 * @param {Creature} catalogCreature
 * @param {number} initiative
 * @param {number} count
 * @param {Creature[]} encounter creatures already fighting, for name numbering
 * @returns {Creature[]}
 */
export function spawnGroup(catalogCreature, initiative, count, encounter) {
  const copies = catalogCreature.isPlayer ? 1 : Math.max(1, count)
  return Array.from({ length: copies }).reduce((group) => {
    const name = catalogCreature.isPlayer ? catalogCreature.name : uniqueEnemyName([...encounter, ...group], catalogCreature.name)
    return [...group, spawnFromCatalog(catalogCreature, initiative, name)]
  }, /** @type {Creature[]} */ ([]))
}

/**
 * Catalog players, by name, that are not already in the encounter.
 * @param {Creature[]} catalog
 * @param {Creature[]} encounter
 * @returns {Creature[]}
 */
export function playersNotInEncounter(catalog, encounter) {
  const present = new Set(encounter.filter((c) => c.isPlayer).map((c) => c.name))
  return sortByName(filterBySide(catalog, 'player').filter((c) => !present.has(c.name)))
}
