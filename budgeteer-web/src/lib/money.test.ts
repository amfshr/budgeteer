import { describe, expect, it } from 'vitest'
import { formatMoney, formatMoneyParts } from './money'

describe('formatMoney', () => {
  it('formats minor units as GBP', () => {
    expect(formatMoney(9177, 'GBP')).toBe('£91.77')
  })

  it('formats negative amounts (spend)', () => {
    expect(formatMoney(-450, 'GBP')).toBe('-£4.50')
  })

  it('formats zero', () => {
    expect(formatMoney(0, 'GBP')).toBe('£0.00')
  })

  it('respects the currency argument', () => {
    expect(formatMoney(1000, 'EUR')).toBe('€10.00')
  })
})

describe('formatMoneyParts', () => {
  it('splits major and de-emphasised pence', () => {
    expect(formatMoneyParts(128420, 'GBP')).toEqual({ major: '£1,284', minor: '.20' })
  })

  it('handles negatives', () => {
    expect(formatMoneyParts(-450, 'GBP')).toEqual({ major: '-£4', minor: '.50' })
  })
})
