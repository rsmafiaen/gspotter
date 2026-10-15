import type { venue } from '#/types/venue'

export default function ViewVenue(Current: venue) {
  const fmt = (iso: string) => iso.slice(11, 16)

  return (
    <article className="rounded-2xl border border-[var(--harp-gold)] bg-[var(--cream)] p-5 text-[var(--sea-ink)]">
      <p className="text-xs font-bold tracking-widest uppercase text-[var(--)]">
        {Current.city.name}
      </p>
      <h2 className="mt-1 text-xl font-extrabold">{Current.name}</h2>
      <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
        {Current.address}
      </p>
      <h3 className="mt-4 text-sm font-bold">Opening hours</h3>
      <ul className="mt-1">
        {Current.openingHours.map((oh, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-4 border-t border-[var(--line)] py-2 text-sm"
          >
            <span className="font-semibold">{oh.days.join(', ')}</span>
            <span className="text-[var(--sea-ink-soft)]">
              {fmt(oh.opening)} – {fmt(oh.closing)}
            </span>
          </li>
        ))}
      </ul>
    </article>
  )
}
