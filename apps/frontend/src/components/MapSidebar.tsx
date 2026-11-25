import { useId, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'

import { useMediaQuery } from '#/lib/use-media-query'

const DESKTOP_QUERY = '(min-width: 1024px)'
const DRAG_THRESHOLD_PX = 56
const SHEET_PEEK = '4.5rem'
const SHEET_TOP_GAP = '7.5rem'

interface MapSidebarProps {
  title: string
  /** Lower-case phrase used in the show/hide button labels. */
  label: string
  /** When provided, a refresh button is rendered above the sidebar content. */
  onRefresh?: () => void
  refreshing?: boolean
  children: ReactNode
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

export default function MapSidebar({
  title,
  label,
  onRefresh,
  refreshing = false,
  children,
}: MapSidebarProps) {
  const panelId = useId()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [open, setOpen] = useState<boolean | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef<number | null>(null)
  const dragOffsetRef = useRef(0)
  const suppressClick = useRef(false)

  const isOpen = open ?? isDesktop
  const showHint = !isDesktop && !isOpen && !hasInteracted && !isDragging
  const refreshButton = onRefresh ? (
    <div className="flex pt-2">
      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="rounded-full bg-(--chip-bg) px-3 py-1.5 text-sm font-semibold text-(--sea-ink) transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {refreshing ? 'Finding location…' : 'Refresh location'}
      </button>
    </div>
  ) : null

  function toggle() {
    setHasInteracted(true)
    setOpen(!isOpen)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.button !== 0) return

    dragStartY.current = event.clientY
    dragOffsetRef.current = 0
    setIsDragging(true)

    if (typeof event.currentTarget.setPointerCapture === 'function') {
      event.currentTarget.setPointerCapture(event.pointerId)
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return

    const delta = event.clientY - dragStartY.current

    if (Math.abs(delta) > 8) {
      suppressClick.current = true
    }

    const nextOffset = isOpen ? Math.max(0, delta) : Math.min(0, delta)

    dragOffsetRef.current = nextOffset
    setDragOffset(nextOffset)
  }

  function finishDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (dragStartY.current == null) return

    const offset = dragOffsetRef.current

    dragStartY.current = null
    dragOffsetRef.current = 0
    setIsDragging(false)
    setDragOffset(0)

    if (isOpen && offset > DRAG_THRESHOLD_PX) {
      setHasInteracted(true)
      setOpen(false)
    } else if (!isOpen && offset < -DRAG_THRESHOLD_PX) {
      setHasInteracted(true)
      setOpen(true)
    }

    if (typeof event.currentTarget.releasePointerCapture === 'function') {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    if (suppressClick.current) {
      // The synthetic click follows pointerup, so clear the guard afterwards.
      window.setTimeout(() => {
        suppressClick.current = false
      }, 0)
    }
  }

  function handleClick() {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }

    toggle()
  }

  if (isDesktop) {
    if (!isOpen) {
      return (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={false}
          aria-controls={panelId}
          className="pointer-events-auto relative z-950 flex shrink-0 items-center gap-2 self-start rounded-full border border-(--line) bg-(--surface-strong) px-4 py-2.5 text-sm font-bold text-(--sea-ink) shadow-xl backdrop-blur transition hover:bg-(--chip-bg)"
        >
          {title}
          <Chevron direction="right" />
        </button>
      )
    }

    return (
      <aside
        aria-label={label}
        className="pointer-events-auto relative z-950 flex min-h-0 w-88 shrink-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-strong) shadow-2xl backdrop-blur"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--line) px-4 py-3">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button
            type="button"
            onClick={toggle}
            aria-label={`Hide ${label}`}
            aria-expanded={true}
            aria-controls={panelId}
            className="rounded-full bg-(--chip-bg) p-1.5 text-(--sea-ink) transition hover:-translate-y-0.5"
          >
            <Chevron direction="left" />
          </button>
        </div>

        <div id={panelId} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {refreshButton}
          {children}
        </div>
      </aside>
    )
  }

  const sheetTransform = isOpen
    ? `translateY(${Math.max(0, dragOffset)}px)`
    : dragOffset < 0
      ? `translateY(calc(100% - ${SHEET_PEEK} - ${Math.abs(dragOffset)}px))`
      : `translateY(calc(100% - ${SHEET_PEEK}))`

  return (
    <aside
      aria-label={label}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-920 transition-transform duration-300 ease-out will-change-transform lg:hidden"
      style={{
        height: `calc(100% - ${SHEET_TOP_GAP})`,
        transform: sheetTransform,
        transition: isDragging ? 'none' : undefined,
      }}
    >
      <div
        className={`flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-(--line) bg-(--surface-strong) shadow-[0_-18px_50px_rgba(0,0,0,0.35)] backdrop-blur ${
          showHint ? 'nearby-sheet-hint' : ''
        }`}
      >
        <button
          type="button"
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          aria-label={`${isOpen ? 'Hide' : 'Show'} ${label}`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          style={{ height: SHEET_PEEK }}
          className="flex w-full shrink-0 touch-none flex-col items-center justify-center gap-1.5 px-4 select-none"
        >
          <span className="h-1.5 w-12 rounded-full bg-(--sea-ink-soft)/35" />
          <span className="text-sm font-extrabold text-(--sea-ink)">
            {title}
          </span>
        </button>

        <div
          id={panelId}
          inert={!isOpen}
          aria-hidden={!isOpen}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          {refreshButton}
          {children}
        </div>
      </div>
    </aside>
  )
}
