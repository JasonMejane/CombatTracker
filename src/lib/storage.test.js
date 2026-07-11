import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState } from './storage.js'
import { createCreature } from './creatures.js'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns an empty default when nothing is stored', () => {
    expect(loadState()).toEqual({ creatures: [], activeCreatureId: null })
  })

  it('round-trips saved state', () => {
    const state = {
      creatures: [createCreature({ name: 'Aragorn', hp: 24, initiative: 18, isPlayer: true })],
      activeCreatureId: 'abc',
    }
    saveState(state)
    expect(loadState()).toEqual(state)
  })

  it('persists only creatures and activeCreatureId', () => {
    saveState({ creatures: [], activeCreatureId: null, transient: 'ignore me' })
    expect(loadState()).not.toHaveProperty('transient')
  })

  it('returns the default when stored data is corrupt', () => {
    localStorage.setItem('combat-tracker-state', '{not valid json')
    expect(loadState()).toEqual({ creatures: [], activeCreatureId: null })
  })

  it('backfills fields missing from older saved creatures', () => {
    const legacy = {
      id: 'x',
      name: 'Old Hero',
      maxHp: 10,
      currentHp: 10,
      initiative: 5,
      isPlayer: true,
      deathSaves: { successes: 0, failures: 0 },
    }
    localStorage.setItem(
      'combat-tracker-state',
      JSON.stringify({ creatures: [legacy], activeCreatureId: null }),
    )
    const { creatures } = loadState()
    expect(creatures[0].conditions).toEqual([])
    expect(creatures[0].tempHp).toBe(0)
  })

  it('keeps existing conditions and temp HP when loading', () => {
    const creature = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    creature.conditions = ['poisoned']
    creature.tempHp = 5
    saveState({ creatures: [creature], activeCreatureId: null })
    const { creatures } = loadState()
    expect(creatures[0].conditions).toEqual(['poisoned'])
    expect(creatures[0].tempHp).toBe(5)
  })
})
