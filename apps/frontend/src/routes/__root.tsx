import { lazy, Suspense } from 'react'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'
import loraFont from '../assets/fonts/lora-latin.woff2?url'
import playfairFont from '../assets/fonts/playfair-display-latin.woff2?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark')?stored:'dark';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(mode);root.setAttribute('data-theme',mode);root.style.colorScheme=mode;}catch(e){}})();`

// The mock-location notice depends on `window.isSecureContext`, which is only
// known in the browser. Deciding it after hydration would push the whole page
// down and register as a large layout shift, so the flag is set before the
// first paint and the notice is toggled with plain CSS instead.
const MOCK_LOCATION_SCRIPT = `(function(){try{if(!window.isSecureContext){document.documentElement.setAttribute('data-mock-location','');}}catch(e){}})();`

// Vite hands us `/project2` (no trailing slash) here, so normalize before
// appending asset names.
const BASE_URL = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`

// Loaded on demand so React Router/Query devtools never ship in production.
const Devtools = import.meta.env.DEV
  ? lazy(() => import('../components/Devtools'))
  : null

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'description',
        content:
          'Find pubs near you, compare Guinness prices, check opening hours and read reviews with G-Spotter.',
      },
      {
        name: 'theme-color',
        content: '#100b0b',
      },
      {
        title: 'G-Spotter',
      },
      {
        property: 'og:title',
        content: 'G-Spotter',
      },
      {
        property: 'og:description',
        content:
          'Find pubs near you, compare Guinness prices, check opening hours and read reviews with G-Spotter.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: `${BASE_URL}favicon.ico`,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const isMapPage = useRouterState({
    select: (state) =>
      state.location.pathname === '/' ||
      /^\/[^/]+\/venues\/?$/.test(state.location.pathname),
  })

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: MOCK_LOCATION_SCRIPT }} />
        <link
          rel="preload"
          href={loraFont}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={playfairFont}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <HeadContent />
      </head>
      <body
        className={`font-sans antialiased wrap-anywhere selection:bg-[rgba(211,173,87,0.32)] ${
          isMapPage ? 'overflow-hidden' : ''
        }`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100000] focus:rounded-lg focus:bg-(--surface-strong) focus:px-4 focus:py-2 focus:font-bold focus:text-(--sea-ink) focus:shadow-lg"
        >
          Skip to main content
        </a>
        <Header />
        {children}

        {!isMapPage && <Footer />}
        {Devtools && (
          <Suspense fallback={null}>
            <Devtools />
          </Suspense>
        )}
        <Scripts />
      </body>
    </html>
  )
}
