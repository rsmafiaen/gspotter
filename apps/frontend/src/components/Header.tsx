import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-1000 border-b border-(--harp-gold) bg-(--cream-head) px-4 backdrop-blur-lg">
      <nav
        aria-label="Main"
        className="page-wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 sm:py-4"
      >
        <div className="flex w-full flex-1 items-center justify-between gap-3 text-base font-semibold">
          <a
            href={import.meta.env.BASE_URL}
            className="m-0 p-0 text-left font-display tracking-[0.08em] text-(--header-ink) no-underline font-extrabold hover:text-(--header-ink)"
          >
            G-SPOTTER
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
