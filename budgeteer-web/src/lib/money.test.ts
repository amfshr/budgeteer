import { describe, expect, it } from 'vitest'
import { formatMoney } from './money'

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
