import { useId } from 'react'

import { FormField, inputClassName } from '#/components/ui/FormField'

interface TimeRangeFieldsProps {
  opening: string
  closing: string
  openingLabel?: string
  closingLabel?: string
  onOpeningChange: (value: string) => void
  onClosingChange: (value: string) => void
}

export function TimeRangeFields({
  opening,
  closing,
  openingLabel = 'Opening',
  closingLabel = 'Closing',
  onOpeningChange,
  onClosingChange,
}: TimeRangeFieldsProps) {
  const openingId = useId()
  const closingId = useId()

  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label={openingLabel} htmlFor={openingId}>
        <input
          id={openingId}
          type="time"
          value={opening}
          onChange={(event) => onOpeningChange(event.target.value)}
          required
          className={inputClassName}
        />
      </FormField>
      <FormField label={closingLabel} htmlFor={closingId}>
        <input
          id={closingId}
          type="time"
          value={closing}
          onChange={(event) => onClosingChange(event.target.value)}
          required
          className={inputClassName}
        />
      </FormField>
    </div>
  )
}
