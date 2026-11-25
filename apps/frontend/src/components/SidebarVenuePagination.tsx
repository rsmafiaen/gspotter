import type { RefObject } from 'react'

interface SidebarVenuePaginationProps {
  hasMorePages: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  onLoadMore: () => void
  sentinelRef: RefObject<HTMLDivElement | null>
}

export default function SidebarVenuePagination({
  hasMorePages,
  isFetchingNextPage,
  isFetchNextPageError,
  onLoadMore,
  sentinelRef,
}: SidebarVenuePaginationProps) {
  return (
    <>
      {isFetchNextPageError && (
        <p role="alert" className="mt-3 text-center text-sm text-(--sea-ink)">
          Could not load more venues. Please try again.
        </p>
      )}

      {hasMorePages ? (
        <div className="mt-3 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="rounded-full bg-(--chip-bg) px-4 py-2 text-sm font-semibold text-(--sea-ink) transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isFetchingNextPage ? 'Loading more venues…' : 'Load more venues'}
          </button>
          <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-(--sea-ink-soft)">
          You have reached the end of the list.
        </p>
      )}
    </>
  )
}
