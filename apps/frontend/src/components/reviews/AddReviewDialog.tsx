import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'

import { RatingInput } from '#/components/forms/RatingInput'
import { Button } from '#/components/ui/Button'
import { Dialog, useDialog } from '#/components/ui/Dialog'
import { FormField, inputClassName } from '#/components/ui/FormField'
import { graphqlFetch } from '#/graphql/client'
import { CREATE_REVIEW } from '#/graphql/reviews'
import type { VenueReview } from '#/types/venue'

const USERNAME_STORAGE_KEY = 'g-spotter:review-username'
const BODY_MAX_LENGTH = 1000

interface ReviewInput {
  venueId: string
  username: string
  body: string
  rating: number
}

interface AddReviewDialogProps {
  venueId: string
  venueName: string
}

export default function AddReviewDialog({
  venueId,
  venueName,
}: AddReviewDialogProps) {
  return (
    <Dialog
      trigger={
        <Button>
          <span aria-hidden="true" className="text-base leading-none">
            ＋
          </span>
          Add review
        </Button>
      }
      title="Add a review"
      description={`Share your thoughts about ${venueName}.`}
    >
      <AddReviewForm venueId={venueId} />
    </Dialog>
  )
}

function AddReviewForm({ venueId }: { venueId: string }) {
  const { open, close } = useDialog()
  const nameInputRef = useRef<HTMLInputElement>(null)
  const nameId = useId()
  const bodyId = useId()
  const errorId = useId()

  const [username, setUsername] = useState('')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (input: ReviewInput) =>
      graphqlFetch<{ createReview: VenueReview }>(CREATE_REVIEW, { input }),
    onSuccess: () => {
      setRating(0)
      setBody('')
      setError(null)
      close()
      void queryClient.invalidateQueries({ queryKey: ['venues'] })
    },
    onError: () => {
      setError('Could not post your review. Please try again.')
    },
  })

  useEffect(() => {
    if (!open) return

    const savedName = window.localStorage.getItem(USERNAME_STORAGE_KEY)

    if (savedName) setUsername(savedName)

    setError(null)
  }, [open])

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
    <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
      <FormField label="Your name" htmlFor={nameId}>
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
          className={inputClassName}
        />
      </FormField>

      <RatingInput value={rating} onChange={setRating} />

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
          className={`${inputClassName} min-h-28 resize-y`}
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
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Posting…' : 'Post review'}
        </Button>
      </div>
    </form>
  )
}
