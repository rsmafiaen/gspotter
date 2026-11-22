import { useState } from 'react'

import HARP_SRC from '#/assets/harp.svg?url'

const RATING_VALUES = [1, 2, 3, 4, 5]

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
  legend?: string
}

export function RatingInput({
  value,
  onChange,
  legend = 'Rating',
}: RatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const visibleRating = hoveredRating || value

  return (
    <fieldset className="grid gap-1.5">
      <legend className="text-sm font-bold">{legend}</legend>
      <div
        className="flex flex-wrap items-center"
        onMouseLeave={() => setHoveredRating(0)}
      >
        <span className="mr-2 w-24 shrink-0 text-right text-xs font-bold whitespace-nowrap text-(--sea-ink-soft)">
          Select a rating:
        </span>
        <div className="flex items-center">
          {RATING_VALUES.map((rating) => (
            <label
              key={rating}
              onMouseEnter={() => setHoveredRating(rating)}
              className="flex w-6.75 shrink-0 cursor-pointer items-center justify-center"
            >
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={value === rating}
                onChange={() => onChange(rating)}
                className="peer sr-only"
              />
              <img
                src={HARP_SRC}
                alt=""
                aria-hidden="true"
                draggable={false}
                className={`pointer-events-none block h-5 w-auto max-w-none shrink-0 select-none transition-opacity peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--lagoon-deep) ${
                  rating <= visibleRating ? 'opacity-100' : 'opacity-30'
                }`}
              />
              <span className="sr-only">{rating} out of 5 harps</span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  )
}
