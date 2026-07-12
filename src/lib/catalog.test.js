import { describe, it, expect } from 'vitest'
import { createCatalogCreature, setBaseHp, sortByName, filterBySide, spawnFromCatalog, uniqueEnemyName } from './catalog.js'

describe('createCatalogCreature', () => {
  it('builds a full-HP template with initiative 1', () => {
    const c = createCatalogCreature({ name: 'Goblin', hp: 7, isPlayer: false })
    expect(c).toMatchObject({
      name: 'Goblin',
      maxHp: 7,
      currentHp: 7,
      initiative: 1,
      isPlayer: false,
    })
  })

  it('assigns a unique id', () => {
    const a = createCatalogCreature({ name: 'A', hp: 1, isPlayer: true })
    const b = createCatalogCreature({ name: 'B', hp: 1, isPlayer: true })
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })

  it('stores the given armor class', () => {
    const c = createCatalogCreature({ name: 'Knight', hp: 10, isPlayer: false, ca: 16 })
    expect(c.ca).toBe(16)
  })
})

describe('setBaseHp', () => {
  const base = () => createCatalogCreature({ name: 'Ogre', hp: 20, isPlayer: false })

  it('sets both current and max HP', () => {
    const c = setBaseHp(base(), 15)
    expect(c.currentHp).toBe(15)
    expect(c.maxHp).toBe(15)
  })

  it('clamps values below 1 to 1', () => {
    const c = setBaseHp(base(), 0)
    expect(c.currentHp).toBe(1)
    expect(c.maxHp).toBe(1)
  })

  it('does not mutate the input creature', () => {
    const c = base()
    setBaseHp(c, 5)
    expect(c.currentHp).toBe(20)
    expect(c.maxHp).toBe(20)
  })
})

describe('sortByName', () => {
  const named = (name) => createCatalogCreature({ name, hp: 1, isPlayer: true })

  it('orders alphabetically A to Z', () => {
    const list = [named('Charlie'), named('alice'), named('Bob')]
    expect(sortByName(list).map((c) => c.name)).toEqual(['alice', 'Bob', 'Charlie'])
  })

  it('is case-insensitive', () => {
    const list = [named('banana'), named('Apple')]
    expect(sortByName(list).map((c) => c.name)).toEqual(['Apple', 'banana'])
  })

  it('does not mutate the input array', () => {
    const list = [named('B'), named('A')]
    const before = list.map((c) => c.name)
    sortByName(list)
    expect(list.map((c) => c.name)).toEqual(before)
  })
})

describe('filterBySide', () => {
  const player = createCatalogCreature({ name: 'Hero', hp: 10, isPlayer: true })
  const enemy = createCatalogCreature({ name: 'Goblin', hp: 7, isPlayer: false })
  const list = [player, enemy]

  it('returns everything for "all"', () => {
    expect(filterBySide(list, 'all')).toHaveLength(2)
  })

  it('returns only players for "player"', () => {
    expect(filterBySide(list, 'player')).toEqual([player])
  })

  it('returns only enemies for "enemy"', () => {
    expect(filterBySide(list, 'enemy')).toEqual([enemy])
  })
})

describe('uniqueEnemyName', () => {
  const enemy = (name) => ({ name, isPlayer: false })
  const player = (name) => ({ name, isPlayer: true })

  it('keeps the name when no enemy shares it', () => {
    expect(uniqueEnemyName([], 'Goblin')).toBe('Goblin')
  })

  it('appends 2 when one enemy already has the name', () => {
    expect(uniqueEnemyName([enemy('Goblin')], 'Goblin')).toBe('Goblin 2')
  })

  it('increments past existing indexed copies', () => {
    expect(uniqueEnemyName([enemy('Goblin'), enemy('Goblin 2')], 'Goblin')).toBe('Goblin 3')
  })

  it('ignores players that share the name', () => {
    expect(uniqueEnemyName([player('Goblin')], 'Goblin')).toBe('Goblin')
  })

  it('does not touch unrelated enemy names', () => {
    expect(uniqueEnemyName([enemy('Orc')], 'Goblin')).toBe('Goblin')
  })
})

describe('spawnFromCatalog', () => {
  const source = () => {
    const c = createCatalogCreature({ name: 'Goblin', hp: 7, isPlayer: false, ca: 15 })
    c.currentHp = 3
    c.conditions = ['poisoned']
    c.tempHp = 4
    c.deathSaves = { successes: 1, failures: 2 }
    return c
  }

  it('creates a fresh creature with a new id', () => {
    const src = source()
    expect(spawnFromCatalog(src, 14).id).not.toBe(src.id)
  })

  it('applies the given initiative', () => {
    expect(spawnFromCatalog(source(), 14).initiative).toBe(14)
  })

  it('carries the armor class over unchanged', () => {
    expect(spawnFromCatalog(source(), 14).ca).toBe(15)
  })

  it('starts at full HP regardless of the template current HP', () => {
    const spawned = spawnFromCatalog(source(), 14)
    expect(spawned.currentHp).toBe(7)
    expect(spawned.maxHp).toBe(7)
  })

  it('clears conditions, temp HP and death saves', () => {
    const spawned = spawnFromCatalog(source(), 14)
    expect(spawned.conditions).toEqual([])
    expect(spawned.tempHp).toBe(0)
    expect(spawned.deathSaves).toEqual({ successes: 0, failures: 0 })
  })

  it('does not mutate the source template', () => {
    const src = source()
    spawnFromCatalog(src, 14)
    expect(src.currentHp).toBe(3)
    expect(src.conditions).toEqual(['poisoned'])
  })
})
