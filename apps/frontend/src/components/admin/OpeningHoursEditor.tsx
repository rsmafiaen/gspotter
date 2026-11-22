import { useId } from 'react'

import { DayPicker } from '#/components/forms/DayPicker'
import { TimeRangeFields } from '#/components/forms/TimeRangeFields'
import { Button } from '#/components/ui/Button'
import { Collapsible } from '#/components/ui/Collapsible'
import { formatOpeningDays } from '#/lib/format-opening-hours'

export interface OpeningHoursDraft {
  key: string
  days: string[]
  opening: string
  closing: string
}

let nextKey = 0

export function createOpeningHoursDraft(): OpeningHoursDraft {
  nextKey += 1

  return {
    key: `opening-hours-${nextKey}`,
    days: [],
    opening: '12:00',
    closing: '23:00',
  }
}

interface OpeningHoursEditorProps {
  value: OpeningHoursDraft[]
  onChange: (value: OpeningHoursDraft[]) => void
}

export function OpeningHoursEditor({
  value,
  onChange,
}: OpeningHoursEditorProps) {
  const headingId = useId()

  function update(key: string, patch: Partial<OpeningHoursDraft>) {
    onChange(
      value.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
      ),
    )
  }

  return (
    <section className="grid gap-2" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-bold">
          Opening hours
        </h3>
        <Button
          variant="secondary"
          onClick={() => onChange([...value, createOpeningHoursDraft()])}
        >
          + Add opening hours
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-(--sea-ink-soft)">
          No opening hours added yet.
        </p>
      ) : (
        <ul className="grid gap-2">
          {value.map((entry, index) => {
            const daysLabel = formatOpeningDays(entry.days) || 'Choose days'
            const timesLabel =
              entry.opening && entry.closing
                ? `${entry.opening}–${entry.closing}`
                : 'Choose times'

            return (
              <li key={entry.key}>
                <Collapsible title={`${daysLabel} · ${timesLabel}`}>
                  <div className="grid gap-3">
                    <DayPicker
                      legend={`Days for opening hours ${index + 1}`}
                      value={entry.days}
                      onChange={(days) => update(entry.key, { days })}
                    />
                    <TimeRangeFields
                      opening={entry.opening}
                      closing={entry.closing}
                      onOpeningChange={(opening) =>
                        update(entry.key, { opening })
                      }
                      onClosingChange={(closing) =>
                        update(entry.key, { closing })
                      }
                    />
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        onClick={() =>
                          onChange(
                            value.filter(
                              (candidate) => candidate.key !== entry.key,
                            ),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </Collapsible>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
