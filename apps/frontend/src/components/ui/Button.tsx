import type { ComponentProps } from 'react'

const VARIANTS = {
  primary:
    'bg-(--lagoon-deep) text-(--foam) hover:-translate-y-0.5 hover:opacity-90',
  secondary:
    'bg-(--chip-bg) text-(--sea-ink) hover:-translate-y-0.5 hover:bg-(--link-bg-hover)',
  ghost: 'text-(--sea-ink-soft) hover:bg-(--chip-bg) hover:text-(--sea-ink)',
  danger: 'bg-red-500/10 text-(--sea-ink) hover:bg-red-500/20',
} as const

export type ButtonVariant = keyof typeof VARIANTS

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
}

export function Button({
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep) disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
