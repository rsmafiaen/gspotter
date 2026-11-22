import { useId } from 'react'

import { DAYS, DAY_FULL_LABELS } from '#/lib/days'
import type { Day } from '#/lib/days'

interface DayPickerProps {
  value: string[]
  onChange: (days: string[]) => void
  legend?: string
}

export function DayPicker({
  value,
  onChange,
  legend = 'Days',
}: DayPickerProps) {
  const idPrefix = useId()

  function toggle(day: Day) {
    if (value.includes(day)) {
      onChange(value.filter((selected) => selected !== day))
    } else {
      onChange([...value, day])
    }
  }

  return (
    <fieldset>
      <legend className="text-sm font-bold">{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {DAYS.map((day) => {
          const checked = value.includes(day)

          return (
            <label
              key={day}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs font-bold transition focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--lagoon-deep) ${
                checked
                  ? 'border-(--lagoon-deep) bg-(--link-bg-hover) text-(--sea-ink)'
                  : 'border-(--line) text-(--sea-ink-soft) hover:bg-(--chip-bg)'
              }`}
            >
              <input
                id={`${idPrefix}-${day}`}
                type="checkbox"
                checked={checked}
                onChange={() => toggle(day)}
                className="sr-only"
              />
              <span>{DAY_FULL_LABELS[day]}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
