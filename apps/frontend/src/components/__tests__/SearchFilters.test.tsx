import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EMPTY_SEARCH_FILTERS } from '#/lib/search-filters'
import SearchFilters from '../SearchFilters'

describe('SearchFilters', () => {
  it('expands and collapses the filter fields', async () => {
    const user = userEvent.setup()

    render(
      <SearchFilters
        filters={EMPTY_SEARCH_FILTERS}
        coordinates={null}
        onChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Maximum distance')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filters' }))

    expect(screen.getByLabelText('Maximum distance')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Filters' }))

    expect(screen.queryByLabelText('Maximum distance')).not.toBeInTheDocument()
  })
})
