import type { ReactNode } from 'react'

interface CollapsibleProps {
  title: ReactNode
  children: ReactNode
  className?: string
}

export function Collapsible({
  title,
  children,
  className = '',
}: CollapsibleProps) {
  return (
    <details
      className={`group rounded-xl border border-(--line) bg-(--chip-bg) ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-bold marker:content-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)">
        <span className="min-w-0">{title}</span>
        <span
          aria-hidden="true"
          className="text-xs text-(--sea-ink-soft) transition-transform group-open:rotate-180"
        >
          ▼
        </span>
      </summary>
      <div className="border-t border-(--line) px-3 py-3">{children}</div>
    </details>
  )
}
