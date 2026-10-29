import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-1000 border-b border-(--harp-gold) bg-(--cream-head) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 w-full flex-1 text-base font-semibold">
          <div className="flex w-full items-center justify-between gap-3">
            <a
              href={import.meta.env.BASE_URL}
              className="m-0 p-0 text-left tracking-[0.08em] text-(--cream-dark) font-extrabold"
            >
              G-SPOTTER
            </a>
            <ThemeToggle />
          </div>
        </h2>
      </nav>
    </header>
  )
}
