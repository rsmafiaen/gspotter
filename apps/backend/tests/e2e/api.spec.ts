import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'

import { Day, GlassSize, prisma } from '@t09-project-2/db'

const ADMIN_SECRET = 'secret-string'

function adminToken() {
  return jwt.sign({ sub: 'playwright-admin', role: 'admin' }, ADMIN_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  })
}

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

async function adminQuery<T>(
  request: APIRequestContext,
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await request.post('/', {
    headers: { authorization: `Bearer ${adminToken()}` },
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
  const suffix = randomUUID()
  const cityName = `zz test city ${suffix}`
  const venueName = `zz test venue ${suffix}`
  // Deliberately far from Trondheim and last alphabetically so this fixture
  // cannot affect the ordering assertions in the pagination tests running in
  // parallel.
  const latitude = -33.8688
  const longitude = 151.2093
  let cityId: string | undefined
  let venueId: string | undefined

  try {
    const city = await prisma.city.create({
      data: {
        name: cityName,
        centreLat: latitude,
        centreLon: longitude,
      },
    })
    cityId = city.id

    const venue = await prisma.venue.create({
      data: {
        name: venueName,
        address: 'Testveien 1',
        lat: latitude,
        lon: longitude,
        cityId: city.id,
        openingHours: {
          create: [
            {
              days: [Day.MON],
              opening: new Date('2000-01-01T12:00:00Z'),
              closing: new Date('2000-01-01T20:00:00Z'),
            },
          ],
        },
        pricesSighted: {
          create: [
            {
              price: 99,
              size: GlassSize.PINT,
              limitation: [],
            },
          ],
        },
        reviews: {
          create: [
            {
              username: 'fixture-user',
              body: 'Fixture review',
              rating: 4,
            },
          ],
        },
      },
    })
    venueId = venue.id

    const { venue: venues } = await query<{
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

    const createdVenue = venues.find(({ name }) => name === venueName)
    expect(createdVenue).toBeDefined()

    if (!createdVenue) {
      throw new Error(`Created venue "${venueName}" was not returned`)
    }

    expect(createdVenue.city.name).toBe(cityName)
    expect(createdVenue.openingHours).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          days: expect.arrayContaining(['MON']),
        }),
      ]),
    )
    expect(createdVenue.pricesSighted).toEqual(
      expect.arrayContaining([expect.objectContaining({ price: 99 })]),
    )
    expect(createdVenue.reviews).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: 'fixture-user', rating: 4 }),
      ]),
    )
  } finally {
    if (venueId) {
      await prisma.review.deleteMany({ where: { venueId } })
      await prisma.priceSighting.deleteMany({ where: { venueId } })
      await prisma.openingHours.deleteMany({ where: { venueId } })
      await prisma.openingHoursNote.deleteMany({ where: { venueId } })
      await prisma.venue.deleteMany({ where: { id: venueId } })
    }

    if (cityId) {
      await prisma.city.deleteMany({ where: { id: cityId } })
    }
  }
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

test('createPriceSighting persists a sighting for its venue', async ({
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

  let createdSightingId: string | undefined

  try {
    const { createPriceSighting } = await query<{
      createPriceSighting: {
        id: string
        price: number
        size: string
        sizeMl: number | null
        Limitations: string[]
        timeStart: string | null
        timeEnd: string | null
        timeSighted: string
      }
    }>(
      request,
      `
        mutation CreatePriceSighting(
          $input: MutationCreatePriceSightingInput!
        ) {
          createPriceSighting(input: $input) {
            id
            price
            size
            sizeMl
            Limitations
            timeStart
            timeEnd
            timeSighted
          }
        }
      `,
      {
        input: {
          venueId: seededVenue.id,
          price: 123.5,
          size: 'PINT',
          sizeMl: 568,
          limitation: ['MEMBERSHIP'],
        },
      },
    )
    createdSightingId = createPriceSighting.id

    expect(createPriceSighting).toMatchObject({
      id: expect.any(String),
      price: 123.5,
      size: 'PINT',
      sizeMl: 568,
      Limitations: ['MEMBERSHIP'],
      timeStart: null,
      timeEnd: null,
    })
    expect(Number.isNaN(Date.parse(createPriceSighting.timeSighted))).toBe(
      false,
    )

    const { venue: venuesWithPrices } = await query<{
      venue: {
        id: string
        pricesSighted: {
          id: string
          price: number
          size: string
          Limitations: string[]
        }[]
      }[]
    }>(
      request,
      `
        query {
          venue {
            id
            pricesSighted {
              id
              price
              size
              Limitations
            }
          }
        }
      `,
    )
    const persistedSighting = venuesWithPrices
      .find(({ id }) => id === seededVenue.id)
      ?.pricesSighted.find(({ id }) => id === createPriceSighting.id)

    expect(persistedSighting).toEqual({
      id: createPriceSighting.id,
      price: 123.5,
      size: 'PINT',
      Limitations: ['MEMBERSHIP'],
    })
  } finally {
    if (createdSightingId) {
      await prisma.priceSighting.deleteMany({
        where: { id: createdSightingId },
      })
    }
  }
})

test('createPriceSighting requires both times for a TIME limitation', async ({
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

  if (!seededVenue) {
    throw new Error('Seeded venue "Den Gode Nabo" was not returned')
  }

  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          createPriceSighting(
            input: {
              venueId: "${seededVenue.id}"
              price: 89
              size: PINT
              limitation: [TIME]
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe(
    'timeStart and timeEnd are required when limitation includes TIME, and must otherwise be omitted',
  )
})

test('createPriceSighting rejects an unknown venue', async ({ request }) => {
  const unknownVenueId = '00000000-0000-0000-0000-000000000000'
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          createPriceSighting(
            input: {
              venueId: "${unknownVenueId}"
              price: 89
              size: PINT
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe(`Unknown venue: ${unknownVenueId}`)
})

test('findOrCreateCity reuses matching places and separates same-named cities', async ({
  request,
}) => {
  const name = `Playwright ${randomUUID()}`
  const displayName = `${name}, Testland`
  const variables = {
    input: { name, displayName, lat: 59.1234, lon: 10.5678 },
  }

  try {
    const { findOrCreateCity } = await adminQuery<{
      findOrCreateCity: {
        id: string
        name: string
        displayName: string | null
        lat: number
        lon: number
      }
    }>(
      request,
      `
        mutation FindOrCreateCity($input: MutationFindOrCreateCityInput!) {
          findOrCreateCity(input: $input) {
            id
            name
            displayName
            lat
            lon
          }
        }
      `,
      variables,
    )

    expect(findOrCreateCity).toMatchObject({
      id: expect.any(String),
      name,
      displayName,
      lat: 59.1234,
      lon: 10.5678,
    })

    const second = await adminQuery<{
      findOrCreateCity: { id: string }
    }>(
      request,
      `
        mutation FindOrCreateCity($input: MutationFindOrCreateCityInput!) {
          findOrCreateCity(input: $input) {
            id
          }
        }
      `,
      variables,
    )

    expect(second.findOrCreateCity.id).toBe(findOrCreateCity.id)

    const otherPlace = await adminQuery<{
      findOrCreateCity: { id: string; displayName: string | null }
    }>(
      request,
      `
        mutation FindOrCreateCity($input: MutationFindOrCreateCityInput!) {
          findOrCreateCity(input: $input) {
            id
            displayName
          }
        }
      `,
      {
        input: {
          name,
          displayName: `${name}, Anotherland`,
          lat: 40.7128,
          lon: -74.006,
        },
      },
    )

    expect(otherPlace.findOrCreateCity.id).not.toBe(findOrCreateCity.id)
    expect(otherPlace.findOrCreateCity.displayName).toBe(`${name}, Anotherland`)

    const cities = await prisma.city.findMany({ where: { name } })
    expect(cities).toHaveLength(2)
  } finally {
    await prisma.city.deleteMany({ where: { name } })
  }
})

test('findOrCreateCity requires an admin user', async ({ request }) => {
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          findOrCreateCity(
            input: { name: "Playwright city", lat: 59.1234, lon: 10.5678 }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe('Unauthorized')
})

test('createVenue rejects an unknown city before geocoding', async ({
  request,
}) => {
  const unknownCityId = '00000000-0000-0000-0000-000000000000'
  const response = await request.post('/', {
    headers: { authorization: `Bearer ${adminToken()}` },
    data: {
      query: `
        mutation {
          createVenue(
            input: {
              name: "Playwright venue"
              address: "Øvre Bakklandet 66, Trondheim"
              cityId: "${unknownCityId}"
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe(`Unknown city: ${unknownCityId}`)
})

test('createVenue requires an admin user', async ({ request }) => {
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          createVenue(
            input: {
              name: "Playwright venue"
              address: "Øvre Bakklandet 66, Trondheim"
              cityId: "00000000-0000-0000-0000-000000000000"
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe('Unauthorized')
})

test('updateVenue updates venue details and replaces opening hours', async ({
  request,
}) => {
  const suffix = randomUUID()
  let cityId: string | undefined
  let venueId: string | undefined

  try {
    const city = await prisma.city.create({
      data: {
        name: `zz update city ${suffix}`,
        displayName: `zz update city ${suffix}, Testland`,
        centreLat: 59.1234,
        centreLon: 10.5678,
      },
    })
    cityId = city.id

    const venue = await prisma.venue.create({
      data: {
        name: `zz update venue ${suffix}`,
        address: 'Testveien 3',
        lat: 59.1234,
        lon: 10.5678,
        cityId: city.id,
        openingHours: {
          create: [
            {
              days: [Day.MON],
              opening: new Date('2000-01-01T12:00:00Z'),
              closing: new Date('2000-01-01T20:00:00Z'),
            },
          ],
        },
      },
    })
    venueId = venue.id

    const updatedName = `zz updated venue ${suffix}`
    const { updateVenue } = await adminQuery<{
      updateVenue: {
        id: string
        name: string
        address: string
        city: { id: string }
        openingHours: { days: string[] }[]
      }
    }>(
      request,
      `
        mutation UpdateVenue($input: MutationUpdateVenueInput!) {
          updateVenue(input: $input) {
            id
            name
            address
            city {
              id
            }
            openingHours {
              days
            }
          }
        }
      `,
      {
        input: {
          id: venue.id,
          name: updatedName,
          address: 'Testveien 3',
          cityId: city.id,
          openingHours: [
            {
              days: ['TUE'],
              opening: '2000-01-01T12:00:00.000Z',
              closing: '2000-01-01T20:00:00.000Z',
            },
          ],
        },
      },
    )

    expect(updateVenue).toMatchObject({
      id: venue.id,
      name: updatedName,
      address: 'Testveien 3',
      city: { id: city.id },
      openingHours: [expect.objectContaining({ days: ['TUE'] })],
    })

    const stored = await prisma.venue.findUnique({
      where: { id: venue.id },
      include: { openingHours: true },
    })

    expect(stored?.name).toBe(updatedName)
    expect(stored?.openingHours).toHaveLength(1)
    expect(stored?.openingHours[0]?.days).toEqual([Day.TUE])
  } finally {
    if (venueId) {
      await prisma.openingHours.deleteMany({ where: { venueId } })
      await prisma.openingHoursNote.deleteMany({ where: { venueId } })
      await prisma.priceSighting.deleteMany({ where: { venueId } })
      await prisma.review.deleteMany({ where: { venueId } })
      await prisma.venue.deleteMany({ where: { id: venueId } })
    }

    if (cityId) {
      await prisma.city.deleteMany({ where: { id: cityId } })
    }
  }
})

test('updateVenue requires an admin user', async ({ request }) => {
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          updateVenue(
            input: {
              id: "00000000-0000-0000-0000-000000000000"
              name: "Playwright venue"
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe('Unauthorized')
})

test('updateVenue rejects an unknown venue', async ({ request }) => {
  const unknownVenueId = '00000000-0000-0000-0000-000000000000'
  const response = await request.post('/', {
    headers: { authorization: `Bearer ${adminToken()}` },
    data: {
      query: `
        mutation {
          updateVenue(
            input: {
              id: "${unknownVenueId}"
              name: "Playwright venue"
            }
          ) {
            id
          }
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe(`Unknown venue: ${unknownVenueId}`)
})

test('deleteVenue removes the venue and all of its related records', async ({
  request,
}) => {
  const suffix = randomUUID()
  let cityId: string | undefined
  let venueId: string | undefined

  try {
    const city = await prisma.city.create({
      data: {
        name: `zz delete city ${suffix}`,
        centreLat: 59.9139,
        centreLon: 10.7522,
      },
    })
    cityId = city.id

    const venue = await prisma.venue.create({
      data: {
        name: `zz delete venue ${suffix}`,
        address: 'Testveien 2',
        lat: 59.9139,
        lon: 10.7522,
        cityId: city.id,
        openingHours: {
          create: [
            {
              days: [Day.MON],
              opening: new Date('2000-01-01T12:00:00Z'),
              closing: new Date('2000-01-01T20:00:00Z'),
            },
          ],
        },
        openingHoursNotes: {
          create: [{ days: [Day.MON], note: 'Closed in July.' }],
        },
        pricesSighted: {
          create: [
            {
              price: 99,
              size: GlassSize.PINT,
              limitation: [],
            },
          ],
        },
        reviews: {
          create: [
            {
              username: 'playwright',
              body: `Delete venue review ${suffix}`,
              rating: 4,
            },
          ],
        },
      },
    })
    venueId = venue.id

    const { deleteVenue } = await adminQuery<{ deleteVenue: boolean }>(
      request,
      `
        mutation DeleteVenue($id: String!) {
          deleteVenue(id: $id)
        }
      `,
      { id: venue.id },
    )

    expect(deleteVenue).toBe(true)

    const [deletedVenue, openingHours, openingHoursNotes, prices, reviews] =
      await Promise.all([
        prisma.venue.findUnique({ where: { id: venue.id } }),
        prisma.openingHours.count({ where: { venueId: venue.id } }),
        prisma.openingHoursNote.count({ where: { venueId: venue.id } }),
        prisma.priceSighting.count({ where: { venueId: venue.id } }),
        prisma.review.count({ where: { venueId: venue.id } }),
      ])

    expect(deletedVenue).toBeNull()
    expect(openingHours).toBe(0)
    expect(openingHoursNotes).toBe(0)
    expect(prices).toBe(0)
    expect(reviews).toBe(0)
  } finally {
    if (venueId) {
      await prisma.openingHours.deleteMany({ where: { venueId } })
      await prisma.openingHoursNote.deleteMany({ where: { venueId } })
      await prisma.priceSighting.deleteMany({ where: { venueId } })
      await prisma.review.deleteMany({ where: { venueId } })
      await prisma.venue.deleteMany({ where: { id: venueId } })
    }

    if (cityId) {
      await prisma.city.deleteMany({ where: { id: cityId } })
    }
  }
})

test('deleteVenue rejects an unknown venue', async ({ request }) => {
  const unknownVenueId = '00000000-0000-0000-0000-000000000000'
  const response = await request.post('/', {
    headers: { authorization: `Bearer ${adminToken()}` },
    data: {
      query: `
        mutation {
          deleteVenue(id: "${unknownVenueId}")
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe(`Unknown venue: ${unknownVenueId}`)
})

test('deleteReview removes the review', async ({ request }) => {
  const { venue } = await query<{ venue: { id: string }[] }>(
    request,
    `
      query {
        venue {
          id
        }
      }
    `,
  )
  const seededVenue = venue.at(0)

  if (!seededVenue) {
    throw new Error('No seeded venue was returned')
  }

  const review = await prisma.review.create({
    data: {
      venueId: seededVenue.id,
      username: 'playwright',
      body: `Delete review ${randomUUID()}`,
      rating: 3,
    },
  })

  const { deleteReview } = await adminQuery<{ deleteReview: boolean }>(
    request,
    `
      mutation DeleteReview($id: String!) {
        deleteReview(id: $id)
      }
    `,
    { id: review.id },
  )

  expect(deleteReview).toBe(true)
  expect(
    await prisma.review.findUnique({ where: { id: review.id } }),
  ).toBeNull()
})

test('deletePriceSighting removes the price sighting', async ({ request }) => {
  const { venue } = await query<{ venue: { id: string }[] }>(
    request,
    `
      query {
        venue {
          id
        }
      }
    `,
  )
  const seededVenue = venue.at(0)

  if (!seededVenue) {
    throw new Error('No seeded venue was returned')
  }

  const sighting = await prisma.priceSighting.create({
    data: {
      venueId: seededVenue.id,
      price: 99,
      size: GlassSize.PINT,
      limitation: [],
    },
  })

  try {
    const { deletePriceSighting } = await adminQuery<{
      deletePriceSighting: boolean
    }>(
      request,
      `
        mutation DeletePriceSighting($id: String!) {
          deletePriceSighting(id: $id)
        }
      `,
      { id: sighting.id },
    )

    expect(deletePriceSighting).toBe(true)
    expect(
      await prisma.priceSighting.findUnique({ where: { id: sighting.id } }),
    ).toBeNull()
  } finally {
    await prisma.priceSighting.deleteMany({ where: { id: sighting.id } })
  }
})

test('delete mutations require an admin user', async ({ request }) => {
  const response = await request.post('/', {
    data: {
      query: `
        mutation {
          deleteVenue(id: "00000000-0000-0000-0000-000000000000")
          deleteReview(id: "00000000-0000-0000-0000-000000000000")
          deletePriceSighting(id: "00000000-0000-0000-0000-000000000000")
        }
      `,
    },
  })
  const body: GraphQLResponse<unknown> = await response.json()

  expect(response.status(), JSON.stringify(body)).toBe(200)
  expect(body.errors?.[0]?.message).toBe('Unauthorized')
})
