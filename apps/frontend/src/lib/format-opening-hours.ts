const DAY_ORDER = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

type Day = (typeof DAY_ORDER)[number]

const DAY_NAMES: Record<Day, string> = {
  MON: 'Monday',
  TUE: 'Tuesday',
  WED: 'Wednesday',
  THU: 'Thursday',
  FRI: 'Friday',
  SAT: 'Saturday',
  SUN: 'Sunday',
}

const WEEKDAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const WEEKEND: Day[] = ['SAT', 'SUN']

function isDay(value: string): value is Day {
  return (DAY_ORDER as readonly string[]).includes(value)
}

function isSameDays(days: Day[], expected: Day[]) {
  return (
    days.length === expected.length &&
    days.every((day, index) => day === expected[index])
  )
}

function formatRun(run: Day[]): string {
  if (isSameDays(run, WEEKDAYS)) return 'Weekdays'
  if (isSameDays(run, WEEKEND)) return 'Weekends'
  if (run.length === 1) return DAY_NAMES[run[0]]

  return `${DAY_NAMES[run[0]]}–${DAY_NAMES[run[run.length - 1]]}`
}

// Turns a set of opening-hours days into readable labels, collapsing
// consecutive days into ranges and naming whole weekdays/weekends.
// Examples: MON–FRI → "Weekdays", SAT–SUN → "Weekends",
// MON–WED → "Monday–Wednesday", MON/WED/FRI → "Monday, Wednesday and Friday".
export function formatOpeningTime(iso: string): string {
  return iso.slice(11, 16)
}

export interface OpeningHoursEntry {
  days: string[]
  opening: string
  closing: string
}

/** Compact one-line summary, e.g. "Weekdays 14:00–02:00 · Weekends 12:00–03:00". */
export function formatOpeningHours(entries: OpeningHoursEntry[]): string {
  return entries
    .map(
      (entry) =>
        `${formatOpeningDays(entry.days)} ${formatOpeningTime(entry.opening)}–${formatOpeningTime(entry.closing)}`,
    )
    .join(' · ')
}

export function formatOpeningDays(days: string[]): string {
  const sorted = [...new Set(days.map((day) => day.toUpperCase()))]
    .filter(isDay)
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b))

  if (sorted.length === 0) return ''
  if (sorted.length === DAY_ORDER.length) return 'Every day'

  const runs: Day[][] = []

  for (const day of sorted) {
    const currentRun = runs.at(-1)
    const previousDay = currentRun?.at(-1)

    if (
      currentRun &&
      previousDay &&
      DAY_ORDER.indexOf(day) === DAY_ORDER.indexOf(previousDay) + 1
    ) {
      currentRun.push(day)
    } else {
      runs.push([day])
    }
  }

  const labels = runs.map(formatRun)

  if (labels.length === 1) return labels[0]

  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`
}
