/**
 * Opening hours are stored as `timetz` values. The date part is only a
 * reference and never shown, so we attach times to a fixed date in the
 * Norwegian winter offset used by the seed data.
 */
export function timeToIso(time: string): string {
  return new Date(`2000-01-01T${time}:00+01:00`).toISOString()
}
