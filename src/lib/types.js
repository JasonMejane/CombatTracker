/**
 * Shared JSDoc type definitions for the combat/catalog domain.
 * This module exports no runtime values — it exists only to be referenced
 * from `@typedef {import('./types.js').X}` annotations.
 */

/**
 * @typedef {Object} DeathSaves
 * @property {number} successes
 * @property {number} failures
 */

/**
 * A combatant. Catalog entries reuse this exact shape (with `initiative` 1).
 * @typedef {Object} Creature
 * @property {string} id
 * @property {string} name
 * @property {number} maxHp
 * @property {number} currentHp
 * @property {number} initiative
 * @property {number} ca armor class
 * @property {boolean} isPlayer true = player (green), false = enemy (red)
 * @property {DeathSaves} deathSaves
 * @property {string[]} conditions condition keys
 * @property {number} tempHp
 */

/**
 * Spec accepted by `createCreature`. `maxHp` defaults to `hp`; `ca` defaults to 10.
 * @typedef {Object} CreatureInput
 * @property {string} name
 * @property {number} hp
 * @property {number} initiative
 * @property {boolean} isPlayer
 * @property {number} [maxHp]
 * @property {number} [ca]
 */

/**
 * Spec accepted by `createCatalogCreature` (initiative is fixed at 1).
 * @typedef {Object} CatalogInput
 * @property {string} name
 * @property {number} hp
 * @property {boolean} isPlayer
 * @property {number} [ca]
 */

export {}
