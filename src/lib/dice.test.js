import { describe, it, expect, vi, afterEach } from 'vitest'
import { rollD20, rollInitiative } from './dice.js'

afterEach(() => vi.restoreAllMocks())

describe('rollD20', () => {
  it('returns 1 at the low end of the range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(rollD20()).toBe(1)
  })

  it('returns 20 at the high end of the range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(rollD20()).toBe(20)
  })

  it('stays within 1..20 as an integer across many rolls', () => {
    for (let i = 0; i < 1000; i++) {
      const value = rollD20()
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(20)
    }
  })
})

describe('rollInitiative', () => {
  it('adds the bonus to the die roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    expect(rollInitiative(3)).toBe(14)
  })

  it('adds a positive bonus to a known roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(rollInitiative(5)).toBe(6)
  })

  it('handles a negative bonus', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(rollInitiative(-2)).toBe(18)
  })

  it('coerces a string bonus to a number', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(rollInitiative('4')).toBe(5)
  })
})
