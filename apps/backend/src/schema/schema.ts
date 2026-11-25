import { GlassSize, Prisma, prisma } from '@t09-project-2/db'
import type {
  OpeningHours,
  OpeningHoursNote,
  PriceSighting,
} from '@t09-project-2/db'
import { GraphQLError } from 'graphql'

import { builder } from '../builder.js'
import type { Context } from '../context.js'
import { geocodeAddress, searchCities } from '../geocoding.js'
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
    displayName: t.exposeString('displayName', { nullable: true }),
    lat: t.exposeFloat('centreLat'),
    lon: t.exposeFloat('centreLon'),
  }),
})

interface CityPlace {
  name: string
  displayName: string
  lat: number
  lon: number
}

const cityPlaceRef = builder.objectRef<CityPlace>('CityPlace').implement({
  fields: (t) => ({
    name: t.exposeString('name'),
    displayName: t.exposeString('displayName'),
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
  }),
})

function requireAdmin(context: Context) {
  if (context.user?.role !== 'admin') {
    throw new GraphQLError('Unauthorized', {
      extensions: { code: 'UNAUTHORIZED' },
    })
  }
}

function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180
  const latDelta = toRadians(bLat - aLat)
  const lonDelta = toRadians(bLon - aLon)
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.sin(lonDelta / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

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
    id: true,
    size: true,
    sizeMl: true,
    limitation: true,
    timeStart: true,
    timeEnd: true,
    timeSighted: true,
  },
  fields: (t) => ({
    id: t.exposeString('id'),
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
    CAN: { value: GlassSize.CAN },
    OTHER: { value: GlassSize.OTHER },
  },
})

const dayRef = builder.enumType('Day', {
  values: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const,
})

const limitationsRef = builder.enumType('Limitations', {
  values: ['TIME', 'MEMBERSHIP'] as const,
})

const openingHoursInputRef = builder.inputType('OpeningHoursInput', {
  fields: (t) => ({
    days: t.field({ type: [dayRef], required: true }),
    opening: t.field({ type: 'DateTime', required: true }),
    closing: t.field({ type: 'DateTime', required: true }),
  }),
})

const openingHoursNoteInputRef = builder.inputType('OpeningHoursNoteInput', {
  fields: (t) => ({
    days: t.field({ type: [dayRef], required: true }),
    note: t.string({ required: true }),
  }),
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
          orderBy: { name: 'asc' },
        }),
    }),
    cityPlaceSearch: t.field({
      type: [cityPlaceRef],
      args: {
        name: t.arg.string({ required: true }),
      },
      description:
        'Search cities through Nominatim. Used by the admin form to find places outside the local database.',
      resolve: (_parent, args) => {
        const term = args.name.trim()

        return term.length < 2 ? [] : searchCities(term)
      },
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
    createPriceSighting: t.prismaFieldWithInput({
      type: 'PriceSighting',
      input: {
        venueId: t.input.string({ required: true }),
        price: t.input.float({
          required: true,
          description: 'Price in NOK.',
        }),
        size: t.input.field({ type: glassSizeRef, required: true }),
        sizeMl: t.input.float({
          description: 'Serving size in millilitres, when known.',
        }),
        limitation: t.input.field({
          type: [limitationsRef],
          required: false,
          description: 'Defaults to no limitations.',
        }),
        timeStart: t.input.field({
          type: 'DateTime',
          description: 'Start of the time-limited offer. Requires TIME.',
        }),
        timeEnd: t.input.field({
          type: 'DateTime',
          description: 'End of the time-limited offer. Requires TIME.',
        }),
      },
      resolve: async (query, _parent, args) => {
        const { venueId, price, size, sizeMl, timeStart, timeEnd } = args.input
        const limitation = args.input.limitation ?? []

        if (!Number.isFinite(price) || price <= 0) {
          throw new GraphQLError('Price must be greater than 0', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (sizeMl != null && (!Number.isFinite(sizeMl) || sizeMl <= 0)) {
          throw new GraphQLError('sizeMl must be greater than 0', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        const hasTimeLimit = limitation.includes('TIME')

        if (hasTimeLimit !== (timeStart != null && timeEnd != null)) {
          throw new GraphQLError(
            'timeStart and timeEnd are required when limitation includes TIME, and must otherwise be omitted',
            { extensions: { code: 'BAD_USER_INPUT' } },
          )
        }

        const venue = await prisma.venue.findUnique({
          where: { id: venueId },
          select: { id: true },
        })

        if (venue === null) {
          throw new GraphQLError(`Unknown venue: ${venueId}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        return prisma.priceSighting.create({
          ...query,
          data: {
            venue: { connect: { id: venueId } },
            price,
            size,
            sizeMl: sizeMl ?? null,
            limitation: [...limitation],
            timeStart: timeStart ?? null,
            timeEnd: timeEnd ?? null,
            timeSighted: new Date(),
          },
        })
      },
    }),
    deleteVenue: t.field({
      type: 'Boolean',
      description:
        'Permanently delete a venue together with its opening hours, prices and reviews.',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAdmin(context)

        const venue = await prisma.venue.findUnique({
          where: { id: args.id },
          select: { id: true },
        })

        if (venue === null) {
          throw new GraphQLError(`Unknown venue: ${args.id}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        await prisma.$transaction([
          prisma.openingHours.deleteMany({ where: { venueId: args.id } }),
          prisma.openingHoursNote.deleteMany({ where: { venueId: args.id } }),
          prisma.priceSighting.deleteMany({ where: { venueId: args.id } }),
          prisma.review.deleteMany({ where: { venueId: args.id } }),
          prisma.venue.delete({ where: { id: args.id } }),
        ])

        return true
      },
    }),
    deleteReview: t.field({
      type: 'Boolean',
      description: 'Permanently delete a review.',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAdmin(context)

        const review = await prisma.review.findUnique({
          where: { id: args.id },
          select: { id: true },
        })

        if (review === null) {
          throw new GraphQLError(`Unknown review: ${args.id}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        await prisma.review.delete({ where: { id: args.id } })

        return true
      },
    }),
    deletePriceSighting: t.field({
      type: 'Boolean',
      description: 'Permanently delete a price sighting.',
      args: {
        id: t.arg.string({ required: true }),
      },
      resolve: async (_parent, args, context) => {
        requireAdmin(context)

        const sighting = await prisma.priceSighting.findUnique({
          where: { id: args.id },
          select: { id: true },
        })

        if (sighting === null) {
          throw new GraphQLError(`Unknown price sighting: ${args.id}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        await prisma.priceSighting.delete({ where: { id: args.id } })

        return true
      },
    }),
    createVenue: t.prismaFieldWithInput({
      type: 'Venue',
      input: {
        name: t.input.string({ required: true }),
        address: t.input.string({
          required: true,
          description:
            'Street address used to look up the venue coordinates with Nominatim.',
        }),
        cityId: t.input.string({
          required: true,
          description:
            'ID of an existing city, for example from the city search.',
        }),
        openingHours: t.input.field({
          type: [openingHoursInputRef],
          required: false,
        }),
        openingHoursNotes: t.input.field({
          type: [openingHoursNoteInputRef],
          required: false,
        }),
      },
      resolve: async (query, _parent, args, context) => {
        requireAdmin(context)

        const city = await prisma.city.findUnique({
          where: { id: args.input.cityId },
          select: { id: true, name: true, displayName: true },
        })

        if (city === null) {
          throw new GraphQLError(`Unknown city: ${args.input.cityId}`, {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        const coordinates = await geocodeAddress(
          args.input.address,
          city.displayName ?? city.name,
        )

        if (coordinates === null) {
          throw new GraphQLError(
            `Could not geocode address: ${args.input.address}`,
            { extensions: { code: 'BAD_USER_INPUT' } },
          )
        }

        return prisma.venue.create({
          ...query,
          data: {
            name: args.input.name,
            address: args.input.address,
            lat: coordinates.lat,
            lon: coordinates.lon,
            city: { connect: { id: city.id } },
            openingHours: args.input.openingHours
              ? {
                  create: args.input.openingHours.map((hours) => ({
                    days: [...hours.days],
                    opening: hours.opening,
                    closing: hours.closing,
                  })),
                }
              : undefined,
            openingHoursNotes: args.input.openingHoursNotes
              ? {
                  create: args.input.openingHoursNotes.map((note) => ({
                    days: [...note.days],
                    note: note.note,
                  })),
                }
              : undefined,
          },
        })
      },
    }),
    findOrCreateCity: t.prismaFieldWithInput({
      type: 'City',
      input: {
        name: t.input.string({ required: true }),
        displayName: t.input.string({
          required: false,
          description:
            'Full place name from Nominatim, including region and country.',
        }),
        lat: t.input.float({
          required: true,
          description: 'Latitude of the city centre.',
        }),
        lon: t.input.float({
          required: true,
          description: 'Longitude of the city centre.',
        }),
      },
      resolve: async (query, _parent, args, context) => {
        requireAdmin(context)

        const name = args.input.name.trim()
        const displayName = args.input.displayName?.trim() || null
        const { lat, lon } = args.input

        if (!name) {
          throw new GraphQLError('City name is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
          throw new GraphQLError('lat must be between -90 and 90', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
          throw new GraphQLError('lon must be between -180 and 180', {
            extensions: { code: 'BAD_USER_INPUT' },
          })
        }

        const candidates = await prisma.city.findMany({
          where: {
            name: {
              equals: name,
              mode: 'insensitive',
            },
          },
        })

        const normalizedDisplayName = displayName?.toLocaleLowerCase('nb-NO')
        const existing =
          candidates.find(
            (city) =>
              (normalizedDisplayName !== undefined &&
                city.displayName?.toLocaleLowerCase('nb-NO') ===
                  normalizedDisplayName) ||
              distanceKm(lat, lon, city.centreLat, city.centreLon) <= 25,
          ) ?? null

        if (existing !== null) return existing

        return prisma.city.create({
          ...query,
          data: {
            name,
            displayName,
            centreLat: lat,
            centreLon: lon,
          },
        })
      },
    }),
  }),
})
