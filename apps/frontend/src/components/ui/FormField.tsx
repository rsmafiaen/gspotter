import type { ReactNode } from 'react'

export const inputClassName =
  'w-full rounded-xl bg-(--chip-bg) px-3 py-2 text-sm text-(--sea-ink) outline-none placeholder:text-(--sea-ink-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)'

interface FormFieldProps {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  hint,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-(--sea-ink-soft)">{hint}</p>}
    </div>
  )
}
