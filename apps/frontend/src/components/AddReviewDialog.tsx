import type { FormEvent } from 'react'
import { useId, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { graphqlFetch } from '#/graphql/client'
import { CREATE_REVIEW } from '#/graphql/venues'
import type { VenueReview } from '#/types/venue'

const USERNAME_STORAGE_KEY = 'g-spotter:review-username'
const BODY_MAX_LENGTH = 1000
const RATING_VALUES = [1, 2, 3, 4, 5]

interface ReviewInput {
  venueId: string
  username: string
  body: string
  rating: number
}

export default function AddReviewDialog({
  venueId,
  venueName,
}: {
  venueId: string
  venueName: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const nameId = useId()
  const bodyId = useId()
  const errorId = useId()

  const [username, setUsername] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (input: ReviewInput) =>
      graphqlFetch<{ createReview: VenueReview }>(CREATE_REVIEW, { input }),
    onSuccess: () => {
      setRating(0)
      setHoveredRating(0)
      setBody('')
      setError(null)
      dialogRef.current?.close()
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
    onError: () => {
      setError('Could not post your review. Please try again.')
    },
  })

  const visibleRating = hoveredRating || rating

  function openDialog() {
    const savedName = window.localStorage.getItem(USERNAME_STORAGE_KEY)
    if (savedName) {
      setUsername(savedName)
    }
    setError(null)
    dialogRef.current?.showModal()
  }

  function closeDialog() {
    dialogRef.current?.close()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isPending) return

    const trimmedName = username.trim()
    const trimmedBody = body.trim()

    if (!trimmedName) {
      setError('Please enter your name.')
      nameInputRef.current?.focus()
      return
    }

    if (rating < 1) {
      setError('Please choose a rating.')
      return
    }

    if (!trimmedBody) {
      setError('Please write a short review.')
      return
    }

    setError(null)
    window.localStorage.setItem(USERNAME_STORAGE_KEY, trimmedName)
    mutate({
      venueId,
      username: trimmedName,
      body: trimmedBody,
      rating,
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-xl border border-(--lagoon-deep) bg-(--chip-bg) px-3.5 py-2 text-sm font-bold text-(--sea-ink) shadow-[0_8px_22px_rgba(30,90,72,0.08)] hover:-translate-y-0.5 hover:bg-(--link-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ＋
        </span>
        Add review
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={error ? `${descriptionId} ${errorId}` : descriptionId}
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            closeDialog()
          }
        }}
        className="m-auto max-h-[calc(100dvh_-_2rem)] w-[min(30rem,calc(100vw_-_2rem))] overflow-y-auto rounded-2xl border border-(--line) bg-(--surface-strong) p-0 text-(--sea-ink) shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="relative p-5">
          <h2 id={titleId} className="text-xl font-extrabold">
            Add a review
          </h2>
          <p id={descriptionId} className="mt-1 text-sm text-(--sea-ink-soft)">
            Share your thoughts about {venueName}.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor={nameId} className="text-sm font-bold">
                Your name
              </label>
              <input
                ref={nameInputRef}
                id={nameId}
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={50}
                required
                autoComplete="nickname"
                placeholder="e.g. Kari"
                className="w-full rounded-xl border border-(--line) bg-(--chip-bg) px-3 py-2 text-sm text-(--sea-ink) outline-none placeholder:text-(--sea-ink-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
              />
            </div>

            <fieldset className="grid gap-1.5">
              <legend className="text-sm font-bold">Rating</legend>
              <div
                className="flex flex-wrap items-center gap-1"
                onMouseLeave={() => setHoveredRating(0)}
              >
                {RATING_VALUES.map((value) => (
                  <label
                    key={value}
                    onMouseEnter={() => setHoveredRating(value)}
                    className="cursor-pointer rounded-md p-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--lagoon-deep)"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => setRating(value)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`text-2xl leading-none transition-colors ${
                        value <= visibleRating
                          ? 'text-amber-500'
                          : 'text-(--line)'
                      }`}
                    >
                      ★
                    </span>
                    <span className="sr-only">{value} out of 5 stars</span>
                  </label>
                ))}
                <span className="ml-2 text-xs font-bold text-(--sea-ink-soft)">
                  {rating > 0 ? `${rating} / 5` : 'Select a rating'}
                </span>
              </div>
            </fieldset>

            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <label htmlFor={bodyId} className="text-sm font-bold">
                  Your review
                </label>
                <span className="text-xs font-bold text-(--sea-ink-soft)">
                  {body.length}/{BODY_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id={bodyId}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={BODY_MAX_LENGTH}
                required
                rows={4}
                placeholder="What was the atmosphere, selection and price like?"
                className="min-h-28 w-full resize-y rounded-xl border border-(--line) bg-(--chip-bg) px-3 py-2 text-sm text-(--sea-ink) outline-none placeholder:text-(--sea-ink-soft) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
              />
            </div>

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
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-xl border border-(--line) px-3.5 py-2 text-sm font-bold text-(--sea-ink-soft) hover:bg-(--chip-bg) hover:text-(--sea-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-xl border border-(--lagoon-deep) bg-(--chip-bg) px-3.5 py-2 text-sm font-bold text-(--sea-ink) hover:bg-(--link-bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep) disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Posting…' : 'Post review'}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={closeDialog}
            aria-label="Close dialog"
            className="absolute top-3 right-3 rounded-full px-2 py-1 text-lg leading-none text-(--sea-ink-soft) hover:bg-(--chip-bg) hover:text-(--sea-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--lagoon-deep)"
          >
            ✕
          </button>
        </div>
      </dialog>
    </>
  )
}
