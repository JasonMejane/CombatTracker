import { createCreature } from './creatures.js'

export function createCatalogCreature({ name, hp, isPlayer, ca }) {
  return createCreature({ name, hp, initiative: 1, isPlayer, ca })
}

export function setBaseHp(creature, value) {
  const hp = Math.max(1, Number(value))
  return { ...creature, currentHp: hp, maxHp: hp }
}

export function sortByName(creatures) {
  return [...creatures].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

export function filterBySide(creatures, side) {
  if (side === 'player') return creatures.filter((c) => c.isPlayer)
  if (side === 'enemy') return creatures.filter((c) => !c.isPlayer)
  return creatures
}

export function uniqueEnemyName(creatures, name) {
  const taken = new Set(creatures.filter((c) => !c.isPlayer).map((c) => c.name))
  if (!taken.has(name)) return name
  let index = 2
  while (taken.has(`${name} ${index}`)) index++
  return `${name} ${index}`
}

export function spawnFromCatalog(catalogCreature, initiative, name = catalogCreature.name) {
  const { maxHp, isPlayer, ca } = catalogCreature
  return createCreature({ name, hp: maxHp, initiative, isPlayer, ca })
}
