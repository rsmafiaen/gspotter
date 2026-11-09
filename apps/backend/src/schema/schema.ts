import { GlassSize, Prisma, prisma } from '@t09-project-2/db'
import type {
  OpeningHours,
  OpeningHoursNote,
  PriceSighting,
} from '@t09-project-2/db'
import type { OpeningHours, PriceSighting } from '@t09-project-2/db'
import { GraphQLError } from 'graphql'

import { builder } from '../builder.js'
import { latestPriceSightings } from './price-sightings.js'
import type { VenueWithPriceSightings } from './price-sightings.js'

builder.prismaObject('Venue', {
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    address: t.exposeString('address'),
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    openingHours: t.relation('openingHours'),
    openingHoursNotes: t.relation('openingHoursNotes'),
    city: t.relation('city'),
    pricesSighted: t.relation('pricesSighted'),
    reviews: t.relation('reviews'),
  }),
})

const openingHoursRef = builder.prismaObject('OpeningHours', {
  fields: (t) => ({
    days: t.exposeStringList('days'),
    opening: t.expose('opening', { type: 'DateTime' }),
    closing: t.expose('closing', { type: 'DateTime' }),
  }),
})

const openingHoursNoteRef = builder.prismaObject('OpeningHoursNote', {
  fields: (t) => ({
    days: t.exposeStringList('days'),
    note: t.exposeString('note'),
  }),
})

builder.prismaObject('City', {
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    lat: t.exposeFloat('centreLat'),
    lon: t.exposeFloat('centreLon'),
  }),
})

builder.prismaObject('Review', {
  fields: (t) => ({
    id: t.exposeString('id'),
    username: t.exposeString('username'),
    body: t.exposeString('body'),
    rating: t.exposeInt('rating'),
    timeCreated: t.expose('timeCreated', { type: 'DateTime' }),
    venueId: t.exposeString('venueId'),
  }),
})

const priceSightingRef = builder.prismaObject('PriceSighting', {
  select: {
    size: true,
    sizeMl: true,
    limitation: true,
    timeStart: true,
    timeEnd: true,
    timeSighted: true,
  },
  fields: (t) => ({
    timeSighted: t.expose('timeSighted', { type: 'DateTime' }),
    venue: t.relation('venue'),
    price: t.exposeFloat('price'),
    size: t.exposeString('size'),
    sizeMl: t.exposeFloat('sizeMl', { nullable: true }),
    Limitations: t.exposeStringList('limitation'),
    timeStart: t.expose('timeStart', { type: 'DateTime', nullable: true }),
    timeEnd: t.expose('timeEnd', { type: 'DateTime', nullable: true }),
  }),
})

const glassSizeRef = builder.enumType('GlassSize', {
  values: {
    PINT: { value: GlassSize.PINT },
    HALF_LITER: { value: GlassSize.HALF_LITER },
    QUARTER_LITER: { value: GlassSize.QUARTER_LITER },
    BOX: { value: GlassSize.BOX },
    OTHER: { value: GlassSize.OTHER },
  },
})

type SearchResultItem = {
  id: string
  cityId: string | null
  type: 'venue' | 'city'
  name: string
  lat: number
  lon: number
  distanceKm: number | null
  address: string | null
  openingHours: OpeningHours[] | null
  openingHoursNotes: OpeningHoursNote[] | null
  latestPriceSighting: PriceSighting | null
  averageRating: number | null
  reviewCount: number
}

const searchResultRef = builder
  .objectRef<SearchResultItem>('SearchResult')
  .implement({
    fields: (t) => ({
      id: t.exposeString('id'),
      cityId: t.exposeString('cityId', { nullable: true }),
      type: t.exposeString('type'),
      name: t.exposeString('name'),
      lat: t.exposeFloat('lat'),
      lon: t.exposeFloat('lon'),
      distanceKm: t.exposeFloat('distanceKm', { nullable: true }),
      address: t.exposeString('address', { nullable: true }),
      openingHours: t.expose('openingHours', {
        type: [openingHoursRef],
        nullable: { list: true, items: false },
      }),
      openingHoursNotes: t.expose('openingHoursNotes', {
        type: [openingHoursNoteRef],
        nullable: { list: true, items: false },
      }),
      latestPriceSighting: t.expose('latestPriceSighting', {
        type: priceSightingRef,
        nullable: true,
      }),
      averageRating: t.exposeFloat('averageRating', { nullable: true }),
      reviewCount: t.exposeInt('reviewCount'),
    }),
  })

function applyLatestPriceSightings(venues: VenueWithPriceSightings[]) {
  for (const venue of venues) {
    if (venue.pricesSighted) {
      venue.pricesSighted = latestPriceSightings(venue.pricesSighted)
    }
  }
}

type SearchVenueRow = {
  id: string
  distance_km: number | null
  average_rating: number | null
  review_count: number
  price_sighting_id: string | null
  total_count?: number
}

type VenueFilters = {
  term: string | null
  cityId: string | null
  lat: number | null
  lon: number | null
  maxDistanceKm: number | null
  minPrice: number | null
  maxPrice: number | null
  sizes: GlassSize[]
  minRating: number | null
}

type VenueQueryOptions = {
  orderByDistance?: boolean
  limit?: number | null
  cursor?: string | null
  withTotalCount?: boolean
}

/**
 * A cursor is the id of the last venue on the previous page. We look up that
 * venue to recover its sort key, then continue after the `(sort key, id)` pair
 * in Postgres. This keeps the existing default name ordering intact and gives
 * venues with equal names a deterministic order.
 */
async function findCursorVenue(cursor: string) {
  const venue = await prisma.venue.findUnique({
    where: { id: cursor },
    select: { id: true, name: true, lat: true, lon: true },
  })

  if (!venue) {
    throw new GraphQLError('Venue cursor does not exist', {
      extensions: { code: 'BAD_USER_INPUT' },
    })
  }

  return venue
}

/**
 * Applies every venue filter in Postgres so the client never has to download
 * and filter the full data set. Price filters look at the latest regular
 * (unrestricted) sighting for each serving size, which is also the price the
 * result cards display.
 */
async function findFilteredVenues(
  filters: VenueFilters,
  options: VenueQueryOptions = {},
) {
  const sizes = [...new Set(filters.sizes)]
  const minPrice =
    filters.minPrice != null && filters.minPrice >= 0 ? filters.minPrice : null
  const maxPrice =
    filters.maxPrice != null && filters.maxPrice >= 0 ? filters.maxPrice : null
  const minRating =
    filters.minRating == null
      ? null
      : Math.min(5, Math.max(0, filters.minRating))

  const hasPriceFilter =
    sizes.length > 0 || minPrice != null || maxPrice != null

  const conditions: Prisma.Sql[] = []

  if (filters.term) {
    const contains = `%${filters.term}%`

    conditions.push(
      Prisma.sql`(v.name ILIKE ${contains} OR v.address ILIKE ${contains})`,
    )
  }

  if (filters.cityId) {
    conditions.push(Prisma.sql`v.city_id = ${filters.cityId}::uuid`)
  }

  if (
    filters.lat != null &&
    filters.lon != null &&
    filters.maxDistanceKm != null
  ) {
    const maxDistanceMeters = Math.max(0, filters.maxDistanceKm) * 1000

    conditions.push(
      Prisma.sql`haversine_distance(${filters.lat}::double precision, ${filters.lon}::double precision, v.lat, v.lon) <= ${maxDistanceMeters}::double precision`,
    )
  }

  if (minRating != null) {
    conditions.push(Prisma.sql`ratings.average_rating >= ${minRating}`)
  }

  const priceConditions: Prisma.Sql[] = []

  if (sizes.length > 0) {
    priceConditions.push(Prisma.sql`lp.size::text IN (${Prisma.join(sizes)})`)
  }

  if (minPrice != null) {
    priceConditions.push(Prisma.sql`lp.price >= ${minPrice}`)
  }

  if (maxPrice != null) {
    priceConditions.push(Prisma.sql`lp.price <= ${maxPrice}`)
  }

  if (hasPriceFilter) {
    conditions.push(Prisma.sql`matching_prices.id IS NOT NULL`)
  }

  const matchingPriceWhere =
    priceConditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(priceConditions, ' AND ')}`
      : Prisma.empty

  const orderByDistance =
    options.orderByDistance === true &&
    filters.lat != null &&
    filters.lon != null

  const distanceExpression =
    filters.lat != null && filters.lon != null
      ? Prisma.sql`haversine_distance(${filters.lat}::double precision, ${filters.lon}::double precision, v.lat, v.lon) / 1000`
      : Prisma.sql`NULL::double precision`

  if (options.cursor) {
    const cursorVenue = await findCursorVenue(options.cursor)

    conditions.push(
      orderByDistance && filters.lat != null && filters.lon != null
        ? Prisma.sql`(${distanceExpression}, v.name, v.id) > (
            haversine_distance(${filters.lat}::double precision, ${filters.lon}::double precision, ${cursorVenue.lat}, ${cursorVenue.lon}) / 1000,
            ${cursorVenue.name},
            ${cursorVenue.id}::uuid
          )`
        : Prisma.sql`(v.name, v.id) > (${cursorVenue.name}, ${cursorVenue.id}::uuid)`,
    )
  }

  const orderBy = orderByDistance
    ? Prisma.sql`distance_km ASC, v.name ASC, v.id ASC`
    : Prisma.sql`v.name ASC, v.id ASC`
  const limit = options.limit == null ? null : Math.max(0, options.limit)

  return prisma.$queryRaw<SearchVenueRow[]>(Prisma.sql`
    WITH latest_regular_prices AS (
      SELECT DISTINCT ON (ps.venue_id, ps.size, ps.size_ml)
        ps.id,
        ps.venue_id,
        ps.size,
        ps.size_ml,
        ps.price,
        ps.time_sighted
      FROM price_sighting ps
      WHERE cardinality(ps.limitation) = 0
      ORDER BY ps.venue_id, ps.size, ps.size_ml, ps.time_sighted DESC
    ),
    matching_prices AS (
      SELECT DISTINCT ON (lp.venue_id)
        lp.venue_id,
        lp.id
      FROM latest_regular_prices lp
      ${matchingPriceWhere}
      ORDER BY lp.venue_id, lp.time_sighted DESC
    ),
    ratings AS (
      SELECT
        r.venue_id,
        AVG(r.rating)::double precision AS average_rating,
        COUNT(*)::integer AS review_count
      FROM review r
      GROUP BY r.venue_id
    )
    SELECT
      v.id,
      ${distanceExpression} AS distance_km,
      ratings.average_rating,
      COALESCE(ratings.review_count, 0) AS review_count,
      matching_prices.id AS price_sighting_id
      ${
        options.withTotalCount
          ? Prisma.sql`, COUNT(*) OVER ()::integer AS total_count`
          : Prisma.empty
      }
    FROM venue v
    LEFT JOIN ratings ON ratings.venue_id = v.id
    LEFT JOIN matching_prices ON matching_prices.venue_id = v.id
    ${
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty
    }
    ORDER BY ${orderBy}
    LIMIT ${limit}::integer
  `)
}

/** Counts the same filtered set the venue query would return. */
async function countFilteredVenues(filters: VenueFilters) {
  const rows = await findFilteredVenues(filters, {
    limit: 1,
    withTotalCount: true,
  })

  return rows.at(0)?.total_count ?? 0
}

builder.queryType({
  fields: (t) => ({
    venue: t.prismaField({
      type: ['Venue'],
      args: {
        cityId: t.arg.string({
          description: 'Only return venues in this city.',
        }),
        lat: t.arg.float(),
        lon: t.arg.float(),
        limit: t.arg.int({
          description:
            'Return at most this many venues. Omit to return every venue.',
        }),
        cursor: t.arg.string({
          description:
            'Return venues after this cursor, i.e. the id of the last venue from the previous page. Use the same filters and location as the previous page.',
        }),
        maxDistanceKm: t.arg.float({
          description:
            'Only return venues within this distance in kilometres of lat/lon.',
        }),
        minPrice: t.arg.float({
          description:
            'Only return venues with a latest regular price of at least this amount (NOK).',
        }),
        maxPrice: t.arg.float({
          description:
            'Only return venues with a latest regular price of at most this amount (NOK).',
        }),
        sizes: t.arg({
          type: [glassSizeRef],
          description:
            'Only return venues with a latest regular price for at least one of these serving sizes.',
        }),
        minRating: t.arg.float({
          description:
            'Only return venues whose average review rating is at least this value.',
        }),
      },
      resolve: async (query, _parent, args) => {
        const rows = await findFilteredVenues(
          {
            term: null,
            cityId: args.cityId ?? null,
            lat: args.lat ?? null,
            lon: args.lon ?? null,
            maxDistanceKm: args.maxDistanceKm ?? null,
            minPrice: args.minPrice ?? null,
            maxPrice: args.maxPrice ?? null,
            sizes: args.sizes ?? [],
            minRating: args.minRating ?? null,
          },
          {
            orderByDistance: args.lat != null && args.lon != null,
            limit: args.limit,
            cursor: args.cursor,
          },
        )

        const venues = await prisma.venue.findMany({
          ...query,
          where: { id: { in: rows.map((row) => row.id) } },
        })

        const byId = new Map(venues.map((venue) => [venue.id, venue] as const))

        const sorted = rows.flatMap((row) => {
          const venue = byId.get(row.id)
          return venue ? [venue] : []
        })

        applyLatestPriceSightings(sorted as VenueWithPriceSightings[])

        return sorted
      },
    }),
    venueCount: t.field({
      type: 'Int',
      args: {
        cityId: t.arg.string({
          description: 'Only count venues in this city.',
        }),
        lat: t.arg.float(),
        lon: t.arg.float(),
        maxDistanceKm: t.arg.float({
          description:
            'Only count venues within this distance in kilometres of lat/lon.',
        }),
        minPrice: t.arg.float({
          description:
            'Only count venues with a latest regular price of at least this amount (NOK).',
        }),
        maxPrice: t.arg.float({
          description:
            'Only count venues with a latest regular price of at most this amount (NOK).',
        }),
        sizes: t.arg({
          type: [glassSizeRef],
          description:
            'Only count venues with a latest regular price for at least one of these serving sizes.',
        }),
        minRating: t.arg.float({
          description:
            'Only count venues whose average review rating is at least this value.',
        }),
      },
      resolve: (_parent, args) =>
        countFilteredVenues({
          term: null,
          cityId: args.cityId ?? null,
          lat: args.lat ?? null,
          lon: args.lon ?? null,
          maxDistanceKm: args.maxDistanceKm ?? null,
          minPrice: args.minPrice ?? null,
          maxPrice: args.maxPrice ?? null,
          sizes: args.sizes ?? [],
          minRating: args.minRating ?? null,
        }),
    }),
    city: t.prismaField({
      type: ['City'],
      args: {
        name: t.arg.string({ required: true }),
      },
      resolve: (query, _parent, args) =>
        prisma.city.findMany({
          ...query,
          where: {
            name: {
              contains: args.name,
              mode: 'insensitive',
            },
          },
        }),
    }),
    search: t.field({
      type: [searchResultRef],
      args: {
        term: t.arg.string({ required: true }),
        lat: t.arg.float({
          description:
            'Latitude used to calculate distance to each venue and to filter by distance.',
        }),
        lon: t.arg.float({
          description:
            'Longitude used to calculate distance to each venue and to filter by distance.',
        }),
        maxDistanceKm: t.arg.float({
          description:
            'Only return venues within this many kilometres of lat/lon.',
        }),
        minPrice: t.arg.float({
          description:
            'Only return venues with a latest regular price of at least this amount (NOK).',
        }),
        maxPrice: t.arg.float({
          description:
            'Only return venues with a latest regular price of at most this amount (NOK).',
        }),
        sizes: t.arg({
          type: [glassSizeRef],
          description:
            'Only return venues with a latest regular price for at least one of these serving sizes.',
        }),
        minRating: t.arg.float({
          description:
            'Only return venues whose average review rating is at least this value.',
        }),
      },
      resolve: async (_parent, args) => {
        const sizes = args.sizes ?? []
        const hasVenueFilters =
          sizes.length > 0 ||
          args.minPrice != null ||
          args.maxPrice != null ||
          args.minRating != null ||
          (args.lat != null && args.lon != null && args.maxDistanceKm != null)

        const [rows, cities] = await Promise.all([
          findFilteredVenues({
            term: args.term,
            cityId: null,
            lat: args.lat ?? null,
            lon: args.lon ?? null,
            maxDistanceKm: args.maxDistanceKm ?? null,
            minPrice: args.minPrice ?? null,
            maxPrice: args.maxPrice ?? null,
            sizes,
            minRating: args.minRating ?? null,
          }),
          hasVenueFilters
            ? Promise.resolve([])
            : prisma.city.findMany({
                where: {
                  name: {
                    contains: args.term,
                    mode: 'insensitive',
                  },
                },
                orderBy: { name: 'asc' },
              }),
        ])

        const venues =
          rows.length === 0
            ? []
            : await prisma.venue.findMany({
                where: { id: { in: rows.map((row) => row.id) } },
                include: {
                  openingHours: true,
                  openingHoursNotes: true,
                  pricesSighted: true,
                },
              })

        const venuesById = new Map(
          venues.map((venue) => [venue.id, venue] as const),
        )

        const venueResults = rows.flatMap((row) => {
          const venue = venuesById.get(row.id)

          if (!venue) return []

          const latestPriceSighting = row.price_sighting_id
            ? (venue.pricesSighted.find(
                (sighting) => sighting.id === row.price_sighting_id,
              ) ?? null)
            : null

          return [
            {
              id: venue.id,
              cityId: venue.cityId,
              type: 'venue' as const,
              name: venue.name,
              lat: venue.lat,
              lon: venue.lon,
              distanceKm: row.distance_km,
              address: venue.address,
              openingHours: venue.openingHours,
              openingHoursNotes: venue.openingHoursNotes,
              latestPriceSighting,
              averageRating: row.average_rating,
              reviewCount: row.review_count,
            },
          ]
        })

        return [
          ...venueResults,
          ...cities.map((city) => ({
            id: city.id,
            cityId: null,
            type: 'city' as const,
            name: city.name,
            lat: city.centreLat,
            lon: city.centreLon,
            distanceKm: null,
            address: null,
            openingHours: null,
            openingHoursNotes: null,
            latestPriceSighting: null,
            averageRating: null,
            reviewCount: 0,
          })),
        ]
      },
    }),
  }),
})

builder.mutationType({
  fields: (t) => ({
    createReview: t.prismaFieldWithInput({
      type: 'Review',
      input: {
        venueId: t.input.string({ required: true }),
        username: t.input.string({ required: true }),
        body: t.input.string({ required: true }),
        rating: t.input.int({ required: true }),
      },
      resolve: (query, _parent, args) =>
        prisma.review.create({
          ...query,
          data: {
            ...args.input,
          },
        }),
    }),
  }),
})
