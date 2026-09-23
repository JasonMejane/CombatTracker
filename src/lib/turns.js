import { sortByInitiative, nextActiveId, previousActiveId } from './creatures.js'

/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {{ activeCreatureId: string | null, round: number }} Turn
 */

/**
 * Passes the turn on; wrapping back to the top of the order starts a new round.
 * @param {Creature[]} creatures
 * @param {Turn} turn
 * @returns {Turn}
 */
export function nextTurn(creatures, turn) {
  const activeCreatureId = nextActiveId(creatures, turn.activeCreatureId)
  if (activeCreatureId === null) return turn
  const wrapped = turn.activeCreatureId !== null && orderIndex(creatures, activeCreatureId) <= orderIndex(creatures, turn.activeCreatureId)
  return { activeCreatureId, round: turn.round + Number(wrapped) }
}

/**
 * Steps the turn back; wrapping to the bottom of the order returns to the previous
 * round. Does nothing before the first turn of round 1.
 * @param {Creature[]} creatures
 * @param {Turn} turn
 * @returns {Turn}
 */
export function previousTurn(creatures, turn) {
  const activeCreatureId = previousActiveId(creatures, turn.activeCreatureId)
  if (turn.activeCreatureId === null || activeCreatureId === null) return turn
  const wrapped = orderIndex(creatures, activeCreatureId) >= orderIndex(creatures, turn.activeCreatureId)
  const round = turn.round - Number(wrapped)
  return round < 1 ? turn : { activeCreatureId, round }
}

/**
 * @param {Creature[]} creatures
 * @param {string | null} id
 * @returns {number}
 */
function orderIndex(creatures, id) {
  return sortByInitiative(creatures).findIndex((c) => c.id === id)
}
