import { describe, expect, it } from 'vitest'

import { formatOpeningTime } from '../format-opening-hours'

describe('formatOpeningTime', () => {
  it('converts the stored UTC time into the requested timezone', () => {
    const iso = '1970-01-01T15:00:00.000Z'

    expect(formatOpeningTime(iso, 'Europe/Oslo')).toBe('16:00')
    expect(formatOpeningTime(iso, 'UTC')).toBe('15:00')
    expect(formatOpeningTime(iso, 'America/New_York')).toBe('10:00')
  })

  it('renders midnight as 00:00 rather than 24:00', () => {
    expect(formatOpeningTime('1970-01-01T23:00:00.000Z', 'Europe/Oslo')).toBe(
      '00:00',
    )
  })

  it('uses the offset that applies on the stored date', () => {
    expect(formatOpeningTime('2026-07-01T14:00:00.000Z', 'Europe/Oslo')).toBe(
      '16:00',
    )
  })
})
