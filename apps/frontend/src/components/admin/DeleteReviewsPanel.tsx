import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useMemo, useState } from 'react'

import { Button } from '#/components/ui/Button'
import { ConfirmDialog } from '#/components/ui/ConfirmDialog'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { graphqlFetch } from '#/graphql/client'
import { DELETE_REVIEW } from '#/graphql/reviews'
import { ADMIN_TOKEN } from '#/lib/admin-token'
import type { VenueReview, venue } from '#/types/venue'

interface DeleteReviewsPanelProps {
  venues: venue[]
}

interface ReviewRow {
  review: VenueReview
  venueId: string
  venueName: string
  cityName: string
}

function formatReviewDate(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function DeleteReviewsPanel({ venues }: DeleteReviewsPanelProps) {
  const [venueFilter, setVenueFilter] = useState('')
  const [reviewToDelete, setReviewToDelete] = useState<ReviewRow | null>(null)
  const filterId = useId()
  const queryClient = useQueryClient()

  const rows = useMemo<ReviewRow[]>(
    () =>
      venues
        .flatMap((current) =>
          current.reviews.map((review) => ({
            review,
            venueId: current.id,
            venueName: current.name,
            cityName: current.city.name,
          })),
        )
        .sort((a, b) =>
          b.review.timeCreated.localeCompare(a.review.timeCreated),
        ),
    [venues],
  )

  const filteredRows =
    venueFilter === ''
      ? rows
      : rows.filter((row) => row.venueId === venueFilter)

  const { mutate, reset, isPending, isError, error } = useMutation({
    mutationFn: (id: string) =>
      graphqlFetch<{ deleteReview: boolean }>(
        DELETE_REVIEW,
        { id },
        ADMIN_TOKEN,
      ),
    onSuccess: () => {
      setReviewToDelete(null)
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
      void queryClient.invalidateQueries({ queryKey: ['nearbyVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['cityVenues'] })
      void queryClient.invalidateQueries({ queryKey: ['search'] })
    },
  })

  function openConfirmation(row: ReviewRow) {
    reset()
    setReviewToDelete(row)
  }

  function closeConfirmation() {
    if (isPending) return

    reset()
    setReviewToDelete(null)
  }

  function confirmDelete() {
    if (reviewToDelete !== null) mutate(reviewToDelete.review.id)
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl bg-(--surface-strong) p-5 text-sm text-(--sea-ink-soft)">
        There are no reviews to delete.
      </p>
    )
  }

  const errorMessage = isError
    ? `Could not delete the review${error instanceof Error ? `: ${error.message}` : '.'}`
    : null

  return (
    <div className="grid gap-3">
      {venues.length > 1 && (
        <FormField
          label="Filter by venue"
          htmlFor={filterId}
          className="max-w-md"
        >
          <select
            id={filterId}
            value={venueFilter}
            onChange={(event) => {
              setVenueFilter(event.target.value)
              setReviewToDelete(null)
              reset()
            }}
            className={inputClassName}
          >
            <option value="">All venues</option>
            {venues.map((current) => (
              <option key={current.id} value={current.id}>
                {current.name} · {current.city.name}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <p className="text-xs font-bold text-(--sea-ink-soft)">
        {filteredRows.length} {filteredRows.length === 1 ? 'review' : 'reviews'}
      </p>

      <div className="overflow-hidden rounded-2xl bg-(--surface-strong) text-(--sea-ink)">
        <table
          aria-label="Delete reviews"
          className="striped-table w-full table-fixed border-collapse text-left text-sm"
        >
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[14%]" />
            <col className="w-[8%]" />
            <col className="w-[34%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead className="bg-(--chip-bg)">
            <tr className="text-xs font-bold tracking-wide uppercase text-(--sea-ink-soft)">
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Venue
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Reviewer
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Rating
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Review
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Submitted
              </th>
              <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-3 text-sm text-(--sea-ink-soft)"
                >
                  No reviews have been added for this venue.
                </td>
              </tr>
            )}

            {filteredRows.map((row) => {
              const { review, venueName, cityName } = row
              const submitted = formatReviewDate(review.timeCreated)

              return (
                <tr key={review.id} className="transition-colors">
                  <th scope="row" className="px-4 py-3 font-bold">
                    <span
                      className="block truncate"
                      title={`${venueName} · ${cityName}`}
                    >
                      {venueName}
                      <span className="font-normal text-(--sea-ink-soft)">
                        {' '}
                        · {cityName}
                      </span>
                    </span>
                  </th>
                  <td className="px-4 py-3">
                    <span className="block truncate" title={review.username}>
                      {review.username}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft) whitespace-nowrap">
                    {review.rating} / 5
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft)">
                    <span
                      className="line-clamp-3 wrap-anywhere"
                      title={review.body}
                    >
                      {review.body}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-(--sea-ink-soft)">
                    <span className="block truncate" title={submitted}>
                      {submitted}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="danger"
                      onClick={() => openConfirmation(row)}
                      className="px-2.5 py-1.5 text-xs whitespace-nowrap"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {reviewToDelete && (
        <ConfirmDialog
          open
          title="Delete review?"
          description={
            <>
              The review by <strong>{reviewToDelete.review.username}</strong>{' '}
              for <strong>“{reviewToDelete.venueName}”</strong> will be
              permanently deleted. This cannot be undone.
            </>
          }
          confirmLabel="Delete review"
          pendingLabel="Deleting…"
          pending={isPending}
          error={errorMessage}
          onConfirm={confirmDelete}
          onClose={closeConfirmation}
        />
      )}
    </div>
  )
}
