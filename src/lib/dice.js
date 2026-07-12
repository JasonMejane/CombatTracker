/**
 * Rolls a twenty-sided die.
 * @returns {number} a random integer between 1 and 20 (inclusive)
 */
export function rollD20() {
  return Math.floor(Math.random() * 20) + 1
}

/**
 * Rolls initiative as a d20 plus a flat bonus.
 * @param {number | string} bonus
 * @returns {number}
 */
export function rollInitiative(bonus) {
  return rollD20() + Number(bonus)
}
