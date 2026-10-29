import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Breadcrumbs from '../Breadcrumbs'
import { renderWithProviders } from '#/test/render'

describe('Breadcrumbs', () => {
  it('renders a link for items with a city and marks the last item as current', async () => {
    renderWithProviders(
      <Breadcrumbs
        items={[
          { label: 'Trondheim', cityId: 'trondheim' },
          { label: 'Studentersamfundet' },
        ]}
      />,
    )

    const navigation = await screen.findByRole('navigation', {
      name: 'Breadcrumb',
    })
    const items = within(navigation).getAllByRole('listitem')

    expect(items).toHaveLength(2)
    expect(
      within(items[0]).getByRole('link', { name: 'Trondheim' }),
    ).toHaveAttribute('href', '/trondheim/venues')
    expect(within(items[1]).getByText('Studentersamfundet')).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('does not mark an item without a city as current when it is not last', async () => {
    renderWithProviders(
      <Breadcrumbs
        items={[
          { label: 'Trondheim', cityId: 'trondheim' },
          { label: 'Sentrum' },
          { label: 'Studentersamfundet' },
        ]}
      />,
    )

    expect(await screen.findByText('Sentrum')).not.toHaveAttribute(
      'aria-current',
    )
    expect(screen.getByText('Studentersamfundet')).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
