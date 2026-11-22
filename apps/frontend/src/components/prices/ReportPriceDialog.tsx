import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'

import { TimeRangeFields } from '#/components/forms/TimeRangeFields'
import { Button } from '#/components/ui/Button'
import { Dialog, useDialog } from '#/components/ui/Dialog'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { graphqlFetch } from '#/graphql/client'
import { CREATE_PRICE_SIGHTING } from '#/graphql/price-sightings'
import { timeToIso } from '#/lib/opening-hours'
import type { GlassSize } from '#/types/search'

const SIZES: { value: GlassSize; label: string }[] = [
  { value: 'PINT', label: 'Pint' },
  { value: 'HALF_LITER', label: 'Half litre' },
  { value: 'QUARTER_LITER', label: 'Quarter litre' },
  { value: 'CAN', label: 'Can' },
  { value: 'OTHER', label: 'Other' },
]

const LIMITATIONS = [
  { value: 'MEMBERSHIP', label: 'Member price' },
  { value: 'TIME', label: 'Only during a time window' },
] as const

interface PriceSightingInput {
  venueId: string
  price: number
  size: GlassSize
  sizeMl?: number
  limitation?: string[]
  timeStart?: string
  timeEnd?: string
}

interface ReportPriceDialogProps {
  venueId: string
  venueName: string
}

export function ReportPriceDialog({
  venueId,
  venueName,
}: ReportPriceDialogProps) {
  return (
    <Dialog
      trigger={
        <Button>
          <span aria-hidden="true" className="text-xs font-bold">
            kr
          </span>
          Report price
        </Button>
      }
      title="Report a price"
      description={`Seen a price at ${venueName}? Let other guests know.`}
    >
      <ReportPriceForm venueId={venueId} />
    </Dialog>
  )
}

function ReportPriceForm({ venueId }: { venueId: string }) {
  const { open, close } = useDialog()
  const priceId = useId()
  const sizeId = useId()
  const sizeMlId = useId()
  const errorId = useId()

  const [price, setPrice] = useState('')
  const [size, setSize] = useState<GlassSize>('PINT')
  const [sizeMl, setSizeMl] = useState('')
  const [limitations, setLimitations] = useState<string[]>([])
  const [timeStart, setTimeStart] = useState('16:00')
  const [timeEnd, setTimeEnd] = useState('18:00')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (input: PriceSightingInput) =>
      graphqlFetch<{ createPriceSighting: { id: string } }>(
        CREATE_PRICE_SIGHTING,
        { input },
      ),
    onSuccess: () => {
      reset()
      close()
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Could not report the price. Please try again.',
      )
    },
  })

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  function reset() {
    setPrice('')
    setSize('PINT')
    setSizeMl('')
    setLimitations([])
    setTimeStart('16:00')
    setTimeEnd('18:00')
    setError(null)
  }

  function toggleLimitation(value: string) {
    setLimitations((current) =>
      current.includes(value)
        ? current.filter((limitation) => limitation !== value)
        : [...current, value],
    )
  }

  function changeSize(value: GlassSize) {
    setSize(value)

    if (value !== 'OTHER') {
      setSizeMl('')
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending) return

    const numericPrice = Number(price)

    if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Please enter a price greater than 0.')
      return
    }

    const parsedSizeMl = Number(sizeMl)
    const isOtherSize = size === 'OTHER'
    const numericSizeMl = isOtherSize ? parsedSizeMl : undefined

    if (
      isOtherSize &&
      (!sizeMl.trim() || !Number.isFinite(parsedSizeMl) || parsedSizeMl <= 0)
    ) {
      setError('Please enter the serving size in millilitres.')
      return
    }

    const hasTimeLimit = limitations.includes('TIME')

    if (hasTimeLimit && (!timeStart || !timeEnd)) {
      setError('Please choose both a start and end time.')
      return
    }

    setError(null)
    mutate({
      venueId,
      price: numericPrice,
      size,
      sizeMl: numericSizeMl,
      limitation: limitations,
      timeStart: hasTimeLimit ? timeToIso(timeStart) : undefined,
      timeEnd: hasTimeLimit ? timeToIso(timeEnd) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Price (NOK)" htmlFor={priceId}>
          <input
            id={priceId}
            type="number"
            inputMode="decimal"
            min="1"
            step="0.5"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            placeholder="e.g. 89"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Serving size" htmlFor={sizeId}>
          <select
            id={sizeId}
            value={size}
            onChange={(event) => changeSize(event.target.value as GlassSize)}
            className={inputClassName}
          >
            {SIZES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {size === 'OTHER' && (
        <FormField
          label="Size in millilitres"
          htmlFor={sizeMlId}
          hint="Required when the serving size is Other."
        >
          <input
            id={sizeMlId}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={sizeMl}
            onChange={(event) => setSizeMl(event.target.value)}
            required
            placeholder="e.g. 568"
            className={inputClassName}
          />
        </FormField>
      )}

      <fieldset className="grid gap-2">
        <legend className="text-sm font-bold">Limitations</legend>
        {LIMITATIONS.map((limitation) => (
          <label
            key={limitation.value}
            className="flex items-center gap-2 text-sm text-(--sea-ink-soft)"
          >
            <input
              type="checkbox"
              checked={limitations.includes(limitation.value)}
              onChange={() => toggleLimitation(limitation.value)}
              className="size-4 accent-(--lagoon-deep)"
            />
            {limitation.label}
          </label>
        ))}
      </fieldset>

      {limitations.includes('TIME') && (
        <TimeRangeFields
          opening={timeStart}
          closing={timeEnd}
          openingLabel="Starts"
          closingLabel="Ends"
          onOpeningChange={setTimeStart}
          onClosingChange={setTimeEnd}
        />
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-(--sea-ink)"
        >
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Reporting…' : 'Report price'}
        </Button>
      </div>
    </form>
  )
}
