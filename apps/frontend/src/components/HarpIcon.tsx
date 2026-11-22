import HARP_SRC from '#/assets/harp-rating.svg?url'

// Cropped version of harp.svg, so the icon fills the same space as a star.
export function HarpIcon({ className = '' }: { className?: string }) {
  return (
    <img
      src={HARP_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={`block h-[1em] w-auto max-w-none shrink-0 select-none ${className}`}
    />
  )
}
