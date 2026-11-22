import '@testing-library/jest-dom/vitest'

import { cleanup, configure } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// City search debounces by 1 second, so async queries need more than the
// Testing Library default timeout of 1 second.
configure({ asyncUtilTimeout: 3000 })

// The in-memory router tries to restore scroll position after navigation.
window.scrollTo = vi.fn()

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  window.localStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.style.colorScheme = ''
})

// jsdom does not implement the dialog methods the review form relies on.
if (typeof HTMLDialogElement !== 'undefined') {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true
  }

  HTMLDialogElement.prototype.close = function close() {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
