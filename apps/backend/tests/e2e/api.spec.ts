import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'

import { prisma } from '@t09-project-2/db'

type GraphQLResponse<T> = {
  data?: T | null
  errors?: { message: string }[]
}

async function query<T>(
  request: APIRequestContext,
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await request.post('/', {
    data: { query: document, variables },
  })
  const body: GraphQLResponse<T> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors).toBeUndefined()

  if (body.data == null) {
    throw new Error('GraphQL response did not contain data')
  }

  return body.data
}

test('city query returns Trondheim and its map coordinates', async ({
  request,
}) => {
  const { city } = await query<{
    city: { id: string; name: string; lat: number; lon: number }[]
  }>(
    request,
    `
      query {
        city(name: "Trondheim") {
          id
          name
          lat
          lon
        }
      }
    `,
  )

  expect(city).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: expect.any(String),
        name: 'Trondheim',
        lat: expect.any(Number),
        lon: expect.any(Number),
      }),
    ]),
  )
})

test('venue query returns its related city, hours, prices, and reviews', async ({
  request,
}) => {
  const { venue } = await query<{
    venue: {
      name: string
      city: { name: string }
      openingHours: { days: string[] }[]
      pricesSighted: { price: number }[]
      reviews: { username: string; rating: number }[]
    }[]
  }>(
    request,
    `
      query {
        venue {
          name
          city {
            name
          }
          openingHours {
            days
          }
          pricesSighted {
            price
          }
          reviews {
            username
            rating
          }
        }
      }
    `,
  )

  const seededVenue = venue.find(({ name }) => name === 'Den Gode Nabo')
  expect(seededVenue).toBeDefined()

  if (!seededVenue) {
    throw new Error('Seeded venue "Den Gode Nabo" was not returned')
  }

  expect(seededVenue.city.name).toBe('Trondheim')
  expect(seededVenue.openingHours).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        days: expect.arrayContaining(['MON']),
      }),
    ]),
  )
  expect(seededVenue.pricesSighted.length).toBeGreaterThan(0)
  expect(seededVenue.reviews.length).toBeGreaterThan(0)
})

test('venue query paginates with a cursor without changing its sort order', async ({
  request,
}) => {
  type VenuePage = { venue: { id: string; name: string }[] }

  const venuePage = `
    query Venues($limit: Int, $cursor: String, $lat: Float, $lon: Float) {
      venue(limit: $limit, cursor: $cursor, lat: $lat, lon: $lon) {
        id
        name
      }
    }
  `

  const allByName = await query<VenuePage>(request, venuePage)
  const firstByName = await query<VenuePage>(request, venuePage, { limit: 2 })
  const secondByName = await query<VenuePage>(request, venuePage, {
    limit: 2,
    cursor: firstByName.venue.at(-1)?.id,
  })

  expect(allByName.venue.length).toBeGreaterThanOrEqual(4)
  expect(
    [...firstByName.venue, ...secondByName.venue].map(({ id }) => id),
  ).toEqual(allByName.venue.slice(0, 4).map(({ id }) => id))

  const location = { lat: 63.4305, lon: 10.3951 }
  const allByDistance = await query<VenuePage>(request, venuePage, location)
  const firstByDistance = await query<VenuePage>(request, venuePage, {
    ...location,
    limit: 2,
  })
  const secondByDistance = await query<VenuePage>(request, venuePage, {
    ...location,
    limit: 2,
    cursor: firstByDistance.venue.at(-1)?.id,
  })

  expect(
    [...firstByDistance.venue, ...secondByDistance.venue].map(({ id }) => id),
  ).toEqual(allByDistance.venue.slice(0, 4).map(({ id }) => id))
})

test('venue query filters and paginates within a city', async ({ request }) => {
  const { city } = await query<{ city: { id: string; name: string }[] }>(
    request,
    `
      query {
        city(name: "Trondheim") {
          id
          name
        }
      }
    `,
  )
  const trondheim = city.find(({ name }) => name === 'Trondheim')

  expect(trondheim).toBeDefined()

  if (!trondheim) {
    throw new Error('Seeded city "Trondheim" was not returned')
  }

  const { venue: firstPage } = await query<{
    venue: { id: string; city: { id: string } }[]
  }>(
    request,
    `
      query TrondheimVenues($cityId: String!, $limit: Int, $cursor: String) {
        venue(cityId: $cityId, limit: $limit, cursor: $cursor) {
          id
          city {
            id
          }
        }
      }
    `,
    { cityId: trondheim.id, limit: 2 },
  )

  expect(firstPage).toHaveLength(2)
  expect(firstPage.every((venue) => venue.city.id === trondheim.id)).toBe(true)

  const { venue: secondPage } = await query<{
    venue: { id: string; city: { id: string } }[]
  }>(
    request,
    `
      query TrondheimVenues($cityId: String!, $limit: Int, $cursor: String) {
        venue(cityId: $cityId, limit: $limit, cursor: $cursor) {
          id
          city {
            id
          }
        }
      }
    `,
    { cityId: trondheim.id, limit: 2, cursor: firstPage.at(-1)?.id },
  )

  expect(secondPage.every((venue) => venue.city.id === trondheim.id)).toBe(true)
  expect(secondPage.map(({ id }) => id)).not.toContain(firstPage[0]?.id)
})

test('venueCount returns the total number of venues for a city', async ({
  request,
}) => {
  const { city } = await query<{ city: { id: string }[] }>(
    request,
    `
      query {
        city(name: "Trondheim") {
          id
        }
      }
    `,
  )
  const cityId = city[0]?.id

  expect(cityId).toBeDefined()

  if (!cityId) {
    throw new Error('Seeded city "Trondheim" was not returned')
  }

  const [{ venueCount }, { venue }] = await Promise.all([
    query<{ venueCount: number }>(
      request,
      `
        query VenueCount($cityId: String!) {
          venueCount(cityId: $cityId)
        }
      `,
      { cityId },
    ),
    query<{ venue: { id: string }[] }>(
      request,
      `
        query Venues($cityId: String!) {
          venue(cityId: $cityId) {
            id
          }
        }
      `,
      { cityId },
    ),
  ])

  expect(venueCount).toBe(venue.length)
})

test('venue query rejects an unknown cursor', async ({ request }) => {
  const response = await request.post('/', {
    data: {
      query: `
        query {
          venue(cursor: "00000000-0000-0000-0000-000000000000") {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(body.errors?.[0]?.message).toBe('Venue cursor does not exist')
})

test('createReview returns and persists a review for its venue', async ({
  request,
}) => {
  const { venue } = await query<{ venue: { id: string; name: string }[] }>(
    request,
    `
      query {
        venue {
          id
          name
        }
      }
    `,
  )
  const seededVenue = venue.find(({ name }) => name === 'Den Gode Nabo')
  expect(seededVenue).toBeDefined()

  if (!seededVenue) {
    throw new Error('Seeded venue "Den Gode Nabo" was not returned')
  }

  const username = `playwright-${randomUUID()}`
  const body = `E2E review ${randomUUID()}`
  let createdReviewId: string | undefined

  try {
    const { createReview } = await query<{
      createReview: {
        id: string
        username: string
        body: string
        rating: number
        timeCreated: string
      }
    }>(
      request,
      `
        mutation CreateReview($input: MutationCreateReviewInput!) {
          createReview(input: $input) {
            id
            username
            body
            rating
            timeCreated
          }
        }
      `,
      {
        input: {
          venueId: seededVenue.id,
          username,
          body,
          rating: 4,
        },
      },
    )
    createdReviewId = createReview.id

    expect(createReview).toMatchObject({
      id: expect.any(String),
      username,
      body,
      rating: 4,
    })
    expect(Number.isNaN(Date.parse(createReview.timeCreated))).toBe(false)

    const { venue: venuesWithReviews } = await query<{
      venue: {
        id: string
        reviews: {
          id: string
          username: string
          body: string
          rating: number
          venueId: string
        }[]
      }[]
    }>(
      request,
      `
        query {
          venue {
            id
            reviews {
              id
              username
              body
              rating
              venueId
            }
          }
        }
      `,
    )
    const persistedReview = venuesWithReviews
      .find(({ id }) => id === seededVenue.id)
      ?.reviews.find(({ id }) => id === createReview.id)

    expect(persistedReview).toEqual({
      id: createReview.id,
      username,
      body,
      rating: 4,
      venueId: seededVenue.id,
    })
  } finally {
    if (createdReviewId) {
      await prisma.review.deleteMany({ where: { id: createdReviewId } })
    }
  }
})

test('createReview rejects input missing a required field', async ({
  request,
}) => {
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          createReview(
            input: {
              venueId: "00000000-0000-0000-0000-000000000000"
              username: "playwright"
              rating: 4
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(400)
  expect(body.errors?.[0]?.message).toContain(
    'Field "MutationCreateReviewInput.body" of required type "String!" was not provided.',
  )
})
