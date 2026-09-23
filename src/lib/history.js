import { isDown } from './creatures.js'

/**
 * @typedef {import('./types.js').Creature} Creature
 * @typedef {{ creatures: Creature[], activeCreatureId: string | null, round: number, label: string | null }} HistoryEntry
 */

const HISTORY_LIMIT = 50
const MIN_CONCENTRATION_DC = 10
const MAX_CONCENTRATION_DC = 30

/**
 * Appends a snapshot taken before a change, keeping the most recent `limit` entries.
 * @param {HistoryEntry[]} history
 * @param {HistoryEntry} entry
 * @param {number} [limit]
 * @returns {HistoryEntry[]}
 */
export function record(history, entry, limit = HISTORY_LIMIT) {
  return [...history, entry].slice(-limit)
}

/**
 * @param {HistoryEntry[]} history
 * @returns {{ history: HistoryEntry[], entry: HistoryEntry | null }}
 */
export function undo(history) {
  return { history: history.slice(0, -1), entry: history.at(-1) ?? null }
}

/**
 * A short summary such as "Orc −3 temp HP, −2 HP" of the HP a change actually moved.
 * @param {Creature} before
 * @param {Creature} after
 * @returns {string}
 */
export function describeHpChange(before, after) {
  const parts = [signed(after.tempHp - before.tempHp, 'temp HP'), signed(after.currentHp - before.currentHp, 'HP')].filter(Boolean)
  return `${before.name} ${parts.join(', ') || 'no change'}${concentrationNote(before, after)}`
}

/**
 * @param {Creature} before
 * @param {Creature} after
 * @returns {string}
 */
function concentrationNote(before, after) {
  if (isConcentrating(before) && !isConcentrating(after)) return ' · Concentration lost'
  const dc = concentrationDc(before, after)
  return dc ? ` · Concentration DC ${dc}` : ''
}

/**
 * @param {Creature} creature
 * @returns {boolean}
 */
function isConcentrating(creature) {
  return creature.conditions.includes('concentration')
}

/**
 * The Constitution save DC to keep concentration after a hit: half the damage taken
 * (temp HP included), at least 10 and at most 30. Null when no save is due.
 * @param {Creature} before
 * @param {Creature} after
 * @returns {number | null}
 */
export function concentrationDc(before, after) {
  const taken = before.currentHp + before.tempHp - (after.currentHp + after.tempHp)
  if (!isConcentrating(before) || taken <= 0) return null
  return isDown(after) ? null : Math.min(MAX_CONCENTRATION_DC, Math.max(MIN_CONCENTRATION_DC, Math.floor(taken / 2)))
}

/**
 * @param {number} delta
 * @param {string} unit
 * @returns {string}
 */
function signed(delta, unit) {
  if (delta === 0) return ''
  return `${delta > 0 ? '+' : '−'}${Math.abs(delta)} ${unit}`
}
