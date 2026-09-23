import { describe, it, expect } from 'vitest'
import { record, undo, describeHpChange, concentrationDc } from './history.js'
import { createCreature, damage, heal, addTempHp, toggleCondition } from './creatures.js'

const entry = (label) => ({ creatures: [], activeCreatureId: null, round: 1, label })

describe('record', () => {
  it('appends an entry', () => {
    expect(record([entry('a')], entry('b')).map((e) => e.label)).toEqual(['a', 'b'])
  })

  it('keeps only the most recent entries up to the limit', () => {
    const history = [entry('a'), entry('b')]
    expect(record(history, entry('c'), 2).map((e) => e.label)).toEqual(['b', 'c'])
  })

  it('does not mutate the input history', () => {
    const history = [entry('a')]
    record(history, entry('b'))
    expect(history).toHaveLength(1)
  })
})

describe('undo', () => {
  it('pops the most recent entry', () => {
    const result = undo([entry('a'), entry('b')])
    expect(result.entry.label).toBe('b')
    expect(result.history.map((e) => e.label)).toEqual(['a'])
  })

  it('returns no entry for an empty history', () => {
    expect(undo([])).toEqual({ history: [], entry: null })
  })
})

describe('describeHpChange', () => {
  const orc = () => createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false })

  it('describes damage by the HP actually lost', () => {
    const before = orc()
    expect(describeHpChange(before, damage(before, 7))).toBe('Orc −7 HP')
  })

  it('describes healing by the HP actually gained', () => {
    const before = damage(orc(), 10)
    expect(describeHpChange(before, heal(before, 50))).toBe('Orc +10 HP')
  })

  it('describes temporary HP gained', () => {
    const before = orc()
    expect(describeHpChange(before, addTempHp(before, 5))).toBe('Orc +5 temp HP')
  })

  it('describes a hit split between temporary and current HP', () => {
    const before = addTempHp(orc(), 3)
    expect(describeHpChange(before, damage(before, 5))).toBe('Orc −3 temp HP, −2 HP')
  })

  it('says when nothing changed', () => {
    const before = orc()
    expect(describeHpChange(before, heal(before, 5))).toBe('Orc no change')
  })

  it('says concentration is lost when a concentrating creature drops', () => {
    const before = toggleCondition(orc(), 'concentration')
    expect(describeHpChange(before, damage(before, 15))).toBe('Orc −15 HP · Concentration lost')
  })

  it('adds the concentration save DC when a concentrating creature is hit', () => {
    const before = toggleCondition(orc(), 'concentration')
    expect(describeHpChange(before, damage(before, 7))).toBe('Orc −7 HP · Concentration DC 10')
  })
})

describe('concentrationDc', () => {
  const caster = (hp = 100) => toggleCondition(createCreature({ name: 'Mage', hp, initiative: 8, isPlayer: true }), 'concentration')

  it('is 10 for small hits', () => {
    const before = caster()
    expect(concentrationDc(before, damage(before, 9))).toBe(10)
  })

  it('is half the damage, rounded down, for big hits', () => {
    const before = caster()
    expect(concentrationDc(before, damage(before, 45))).toBe(22)
  })

  it('caps at 30', () => {
    const before = caster(200)
    expect(concentrationDc(before, damage(before, 90))).toBe(30)
  })

  it('counts damage soaked by temporary HP', () => {
    const before = addTempHp(caster(), 30)
    expect(concentrationDc(before, damage(before, 24))).toBe(12)
  })

  it('is null without concentration', () => {
    const before = orcWithoutConcentration()
    expect(concentrationDc(before, damage(before, 5))).toBeNull()
  })

  it('is null when healed', () => {
    const before = damage(caster(), 20)
    expect(concentrationDc(before, heal(before, 5))).toBeNull()
  })

  it('is null once the creature drops to 0 HP', () => {
    const before = caster(10)
    expect(concentrationDc(before, damage(before, 12))).toBeNull()
  })
})

function orcWithoutConcentration() {
  return createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false })
}
