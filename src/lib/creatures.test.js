import { describe, it, expect } from 'vitest'
import {
  createCreature,
  sortByInitiative,
  damage,
  heal,
  isDown,
  addDeathSave,
  deathState,
  revive,
  nextActiveId,
  toggleCondition,
  setTempHp,
  addTempHp,
  setInitiative,
  setCa,
} from './creatures.js'

describe('createCreature', () => {
  it('builds a creature with maxHp equal to the given hp', () => {
    const c = createCreature({ name: 'Goblin', hp: 7, initiative: 12, isPlayer: false })
    expect(c).toMatchObject({
      name: 'Goblin',
      maxHp: 7,
      currentHp: 7,
      initiative: 12,
      isPlayer: false,
    })
  })

  it('assigns a unique id', () => {
    const a = createCreature({ name: 'A', hp: 1, initiative: 1, isPlayer: true })
    const b = createCreature({ name: 'B', hp: 1, initiative: 1, isPlayer: true })
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })

  it('starts with zeroed death saves', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(c.deathSaves).toEqual({ successes: 0, failures: 0 })
  })

  it('uses an explicit maxHp above the current hp', () => {
    const c = createCreature({ name: 'Hurt', hp: 10, maxHp: 24, initiative: 5, isPlayer: true })
    expect(c).toMatchObject({ currentHp: 10, maxHp: 24 })
  })

  it('defaults maxHp to the current hp when not provided', () => {
    const c = createCreature({ name: 'Full', hp: 18, initiative: 5, isPlayer: true })
    expect(c.maxHp).toBe(18)
  })

  it('starts with no conditions', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(c.conditions).toEqual([])
  })

  it('starts with no temporary HP', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(c.tempHp).toBe(0)
  })

  it('stores the given armor class', () => {
    const c = createCreature({ name: 'Knight', hp: 10, initiative: 5, isPlayer: true, ca: 18 })
    expect(c.ca).toBe(18)
  })

  it('defaults armor class to 10 when not provided', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(c.ca).toBe(10)
  })
})

describe('setCa', () => {
  const base = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true, ca: 12 })

  it('sets the armor class to the given number', () => {
    expect(setCa(base(), 16).ca).toBe(16)
  })

  it('coerces a numeric string', () => {
    expect(setCa(base(), '15').ca).toBe(15)
  })

  it('does not mutate the input creature', () => {
    const c = base()
    setCa(c, 16)
    expect(c.ca).toBe(12)
  })
})

describe('setTempHp', () => {
  const base = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })

  it('sets the temporary HP pool', () => {
    expect(setTempHp(base(), 5).tempHp).toBe(5)
  })

  it('replaces the pool rather than stacking', () => {
    expect(setTempHp(setTempHp(base(), 8), 5).tempHp).toBe(5)
  })

  it('clamps negatives to zero', () => {
    expect(setTempHp(base(), -3).tempHp).toBe(0)
  })

  it('does not mutate the input creature', () => {
    const c = base()
    setTempHp(c, 5)
    expect(c.tempHp).toBe(0)
  })
})

describe('addTempHp', () => {
  const base = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })

  it('adds temporary HP to an empty pool', () => {
    expect(addTempHp(base(), 5).tempHp).toBe(5)
  })

  it('accumulates across repeated adds', () => {
    expect(addTempHp(addTempHp(base(), 5), 3).tempHp).toBe(8)
  })

  it('does not mutate the input creature', () => {
    const c = base()
    addTempHp(c, 5)
    expect(c.tempHp).toBe(0)
  })
})

describe('toggleCondition', () => {
  const base = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })

  it('adds a condition when it is absent', () => {
    expect(toggleCondition(base(), 'poisoned').conditions).toEqual(['poisoned'])
  })

  it('removes a condition when it is present', () => {
    const c = toggleCondition(base(), 'poisoned')
    expect(toggleCondition(c, 'poisoned').conditions).toEqual([])
  })

  it('keeps other conditions when toggling one', () => {
    let c = toggleCondition(base(), 'poisoned')
    c = toggleCondition(c, 'stunned')
    expect(toggleCondition(c, 'poisoned').conditions).toEqual(['stunned'])
  })

  it('does not mutate the input creature', () => {
    const c = base()
    toggleCondition(c, 'poisoned')
    expect(c.conditions).toEqual([])
  })
})

describe('sortByInitiative', () => {
  it('orders by initiative descending', () => {
    const list = [
      createCreature({ name: 'Low', hp: 1, initiative: 3, isPlayer: true }),
      createCreature({ name: 'High', hp: 1, initiative: 18, isPlayer: true }),
      createCreature({ name: 'Mid', hp: 1, initiative: 10, isPlayer: true }),
    ]
    expect(sortByInitiative(list).map((c) => c.name)).toEqual(['High', 'Mid', 'Low'])
  })

  it('places players before enemies on an initiative tie', () => {
    const enemy = createCreature({ name: 'Enemy', hp: 1, initiative: 10, isPlayer: false })
    const player = createCreature({ name: 'Player', hp: 1, initiative: 10, isPlayer: true })
    expect(sortByInitiative([enemy, player]).map((c) => c.name)).toEqual(['Player', 'Enemy'])
  })

  it('does not mutate the input array', () => {
    const list = [
      createCreature({ name: 'A', hp: 1, initiative: 1, isPlayer: true }),
      createCreature({ name: 'B', hp: 1, initiative: 9, isPlayer: true }),
    ]
    const before = list.map((c) => c.name)
    sortByInitiative(list)
    expect(list.map((c) => c.name)).toEqual(before)
  })
})

describe('damage', () => {
  it('reduces currentHp', () => {
    const c = createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false })
    expect(damage(c, 5).currentHp).toBe(10)
  })

  it('clamps currentHp at 0', () => {
    const c = createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false })
    expect(damage(c, 100).currentHp).toBe(0)
  })

  it('does not mutate the input creature', () => {
    const c = createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false })
    damage(c, 5)
    expect(c.currentHp).toBe(15)
  })

  it('drains temporary HP before current HP', () => {
    const c = setTempHp(createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false }), 5)
    const hit = damage(c, 3)
    expect(hit.tempHp).toBe(2)
    expect(hit.currentHp).toBe(15)
  })

  it('spills overflow damage into current HP once temp HP is gone', () => {
    const c = setTempHp(createCreature({ name: 'Orc', hp: 15, initiative: 8, isPlayer: false }), 5)
    const hit = damage(c, 8)
    expect(hit.tempHp).toBe(0)
    expect(hit.currentHp).toBe(12)
  })
})

describe('heal', () => {
  it('increases currentHp', () => {
    const c = damage(createCreature({ name: 'Elf', hp: 20, initiative: 8, isPlayer: true }), 10)
    expect(heal(c, 5).currentHp).toBe(15)
  })

  it('clamps currentHp at maxHp', () => {
    const c = damage(createCreature({ name: 'Elf', hp: 20, initiative: 8, isPlayer: true }), 5)
    expect(heal(c, 100).currentHp).toBe(20)
  })

  it('never restores temporary HP', () => {
    const c = setTempHp(createCreature({ name: 'Elf', hp: 20, initiative: 8, isPlayer: true }), 4)
    expect(heal(c, 5).tempHp).toBe(4)
  })
})

describe('isDown', () => {
  it('is true at 0 HP', () => {
    const c = damage(createCreature({ name: 'X', hp: 5, initiative: 1, isPlayer: false }), 5)
    expect(isDown(c)).toBe(true)
  })

  it('is false above 0 HP', () => {
    const c = createCreature({ name: 'X', hp: 5, initiative: 1, isPlayer: false })
    expect(isDown(c)).toBe(false)
  })
})

describe('addDeathSave', () => {
  it('increments successes', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(addDeathSave(c, 'success').deathSaves).toEqual({ successes: 1, failures: 0 })
  })

  it('increments failures', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    expect(addDeathSave(c, 'failure').deathSaves).toEqual({ successes: 0, failures: 1 })
  })

  it('caps each counter at 3', () => {
    let c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    for (let i = 0; i < 5; i++) c = addDeathSave(c, 'success')
    expect(c.deathSaves.successes).toBe(3)
  })

  it('does not mutate the input creature', () => {
    const c = createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })
    addDeathSave(c, 'failure')
    expect(c.deathSaves).toEqual({ successes: 0, failures: 0 })
  })
})

describe('deathState', () => {
  const player = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })

  it('is "alive" above 0 HP', () => {
    expect(deathState(player())).toBe('alive')
  })

  it('is "dying" at 0 HP with fewer than 3 of either save', () => {
    const c = addDeathSave(damage(player(), 10), 'failure')
    expect(deathState(c)).toBe('dying')
  })

  it('is "dead" at 3 failures', () => {
    let c = damage(player(), 10)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'failure')
    expect(deathState(c)).toBe('dead')
  })

  it('is "stable" at 3 successes', () => {
    let c = damage(player(), 10)
    for (let i = 0; i < 3; i++) c = addDeathSave(c, 'success')
    expect(deathState(c)).toBe('stable')
  })
})

describe('nextActiveId', () => {
  const a = createCreature({ name: 'A', hp: 1, initiative: 18, isPlayer: true })
  const b = createCreature({ name: 'B', hp: 1, initiative: 10, isPlayer: true })
  const c = createCreature({ name: 'C', hp: 1, initiative: 3, isPlayer: true })
  const list = [c, a, b]

  it('advances to the next creature in initiative order', () => {
    expect(nextActiveId(list, a.id)).toBe(b.id)
  })

  it('wraps from the last back to the first', () => {
    expect(nextActiveId(list, c.id)).toBe(a.id)
  })

  it('returns the first creature when none is active', () => {
    expect(nextActiveId(list, null)).toBe(a.id)
  })

  it('returns null for an empty list', () => {
    expect(nextActiveId([], null)).toBe(null)
  })
})

describe('setInitiative', () => {
  const base = () => createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true })

  it('sets the initiative to the given number', () => {
    expect(setInitiative(base(), 18).initiative).toBe(18)
  })

  it('coerces a numeric string', () => {
    expect(setInitiative(base(), '12').initiative).toBe(12)
  })

  it('does not mutate the input creature', () => {
    const c = base()
    setInitiative(c, 18)
    expect(c.initiative).toBe(5)
  })
})

describe('revive', () => {
  it('brings a creature back at 1 HP', () => {
    const c = damage(createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true }), 10)
    expect(revive(c).currentHp).toBe(1)
  })

  it('clears death saves', () => {
    let c = damage(createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true }), 10)
    c = addDeathSave(c, 'failure')
    expect(revive(c).deathSaves).toEqual({ successes: 0, failures: 0 })
  })

  it('does not mutate the input creature', () => {
    const c = damage(createCreature({ name: 'Hero', hp: 10, initiative: 5, isPlayer: true }), 10)
    revive(c)
    expect(c.currentHp).toBe(0)
  })
})
