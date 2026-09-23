import { describe, it, expect } from 'vitest'
import { nextTurn, previousTurn } from './turns.js'
import { createCreature, damage } from './creatures.js'

const a = createCreature({ name: 'A', hp: 5, initiative: 18, isPlayer: true })
const b = createCreature({ name: 'B', hp: 5, initiative: 10, isPlayer: true })
const c = createCreature({ name: 'C', hp: 5, initiative: 3, isPlayer: true })
const list = [c, a, b]

describe('nextTurn', () => {
  it('starts combat with the first creature in round 1', () => {
    expect(nextTurn(list, { activeCreatureId: null, round: 1 })).toEqual({ activeCreatureId: a.id, round: 1 })
  })

  it('advances within the round', () => {
    expect(nextTurn(list, { activeCreatureId: a.id, round: 2 })).toEqual({ activeCreatureId: b.id, round: 2 })
  })

  it('starts a new round when wrapping to the top', () => {
    expect(nextTurn(list, { activeCreatureId: c.id, round: 2 })).toEqual({ activeCreatureId: a.id, round: 3 })
  })

  it('starts a new round when the wrap skips a downed enemy at the top', () => {
    const orc = damage(createCreature({ name: 'Orc', hp: 5, initiative: 20, isPlayer: false }), 5)
    expect(nextTurn([orc, ...list], { activeCreatureId: c.id, round: 1 })).toEqual({ activeCreatureId: a.id, round: 2 })
  })

  it('starts a new round when a lone creature acts again', () => {
    expect(nextTurn([a], { activeCreatureId: a.id, round: 1 })).toEqual({ activeCreatureId: a.id, round: 2 })
  })

  it('leaves the turn unchanged when nobody can act', () => {
    const orc = damage(createCreature({ name: 'Orc', hp: 5, initiative: 20, isPlayer: false }), 5)
    expect(nextTurn([orc], { activeCreatureId: null, round: 1 })).toEqual({ activeCreatureId: null, round: 1 })
  })
})

describe('previousTurn', () => {
  it('steps back within the round', () => {
    expect(previousTurn(list, { activeCreatureId: b.id, round: 2 })).toEqual({ activeCreatureId: a.id, round: 2 })
  })

  it('steps back into the previous round when wrapping to the bottom', () => {
    expect(previousTurn(list, { activeCreatureId: a.id, round: 2 })).toEqual({ activeCreatureId: c.id, round: 1 })
  })

  it('does nothing before the first turn of round 1', () => {
    const turn = { activeCreatureId: a.id, round: 1 }
    expect(previousTurn(list, turn)).toEqual(turn)
  })

  it('does nothing when combat has not started', () => {
    const turn = { activeCreatureId: null, round: 1 }
    expect(previousTurn(list, turn)).toEqual(turn)
  })

  it('skips creatures that cannot act', () => {
    const orc = damage(createCreature({ name: 'Orc', hp: 5, initiative: 12, isPlayer: false }), 5)
    expect(previousTurn([...list, orc], { activeCreatureId: b.id, round: 1 })).toEqual({ activeCreatureId: a.id, round: 1 })
  })
})
