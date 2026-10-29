import { Link } from '@tanstack/react-router'

interface BreadcrumbItem {
  label: string
  cityId?: string
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm font-bold">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {index > 0 && (
                <span aria-hidden="true" className="text-(--sea-ink-soft)">
                  →
                </span>
              )}
              {item.cityId ? (
                <Link
                  to="/$cityId/venues"
                  params={{ cityId: item.cityId }}
                  className="text-(--lagoon-deep) hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isLast ? 'text-(--sea-ink-soft)' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
