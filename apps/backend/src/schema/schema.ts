import { prisma } from '@t09-project-2/db'
import type { OpeningHours, PriceSighting } from '@t09-project-2/db'

import { builder } from '../builder.js'
import {
  latestPriceSightings,
  latestUnlimitedSighting,
} from './price-sightings.js'
import type { VenueWithPriceSightings } from './price-sightings.js'

builder.prismaObject('Venue', {
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    address: t.exposeString('address'),
    lat: t.exposeFloat('lat'),
    lon: t.exposeFloat('lon'),
    openingHours: t.relation('openingHours'),
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

type SearchResultItem = {
  id: string
  cityId: string | null
  type: 'venue' | 'city'
  name: string
  lat: number
  lon: number
  address: string | null
  openingHours: OpeningHours[] | null
  latestPriceSighting: PriceSighting | null
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
      address: t.exposeString('address', { nullable: true }),
      openingHours: t.expose('openingHours', {
        type: [openingHoursRef],
        nullable: { list: true, items: false },
      }),
      latestPriceSighting: t.expose('latestPriceSighting', {
        type: priceSightingRef,
        nullable: true,
      }),
    }),
  })

function applyLatestPriceSightings(venues: VenueWithPriceSightings[]) {
  for (const venue of venues) {
    if (venue.pricesSighted) {
      venue.pricesSighted = latestPriceSightings(venue.pricesSighted)
    }
  }
}

builder.queryType({
  fields: (t) => ({
    venue: t.prismaField({
      type: ['Venue'],
      args: {
        lat: t.arg.float(),
        lon: t.arg.float(),
        limit: t.arg.int({
          description:
            'Return at most this many venues. Omit to return every venue.',
        }),
        maxDistanceKm: t.arg.float({
          description:
            'Only return venues within this distance in kilometres of lat/lon.',
        }),
      },
      resolve: async (query, _parent, args) => {
        if (args.lat == null || args.lon == null) {
          const venues = await prisma.venue.findMany({ ...query })

          applyLatestPriceSightings(venues as VenueWithPriceSightings[])

          return venues
        }

        // haversine_distance returns metres. A null radius/limit means "no
        // restriction"; Postgres treats LIMIT NULL as no limit.
        const maxDistanceMeters =
          args.maxDistanceKm == null
            ? null
            : Math.max(0, args.maxDistanceKm) * 1000
        const limit = args.limit == null ? null : Math.max(0, args.limit)

        const nearest = await prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM venue
          WHERE ${maxDistanceMeters}::double precision IS NULL
             OR haversine_distance(${args.lat}, ${args.lon}, lat, lon) <= ${maxDistanceMeters}::double precision
          ORDER BY haversine_distance(${args.lat}, ${args.lon}, lat, lon), name
          LIMIT ${limit}::integer
        `

        const venues = await prisma.venue.findMany({
          ...query,
          where: { id: { in: nearest.map((venue) => venue.id) } },
        })

        const byId = new Map(venues.map((venue) => [venue.id, venue] as const))

        const sorted = nearest.flatMap((row) => {
          const venue = byId.get(row.id)
          return venue ? [venue] : []
        })

        applyLatestPriceSightings(sorted as VenueWithPriceSightings[])

        return sorted
      },
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
      },
      resolve: async (_parent, args) => {
        const contains = {
          contains: args.term,
          mode: 'insensitive' as const,
        }

        const [venues, cities] = await Promise.all([
          prisma.venue.findMany({
            where: {
              OR: [{ name: contains }, { address: contains }],
            },
            include: {
              openingHours: true,
              pricesSighted: true,
            },
            orderBy: { name: 'asc' },
          }),
          prisma.city.findMany({
            where: { name: contains },
            orderBy: { name: 'asc' },
          }),
        ])

        return [
          ...venues.map((venue) => ({
            id: venue.id,
            cityId: venue.cityId,
            type: 'venue' as const,
            name: venue.name,
            lat: venue.lat,
            lon: venue.lon,
            address: venue.address,
            openingHours: venue.openingHours,
            latestPriceSighting: latestUnlimitedSighting(venue.pricesSighted),
          })),
          ...cities.map((city) => ({
            id: city.id,
            cityId: null,
            type: 'city' as const,
            name: city.name,
            lat: city.centreLat,
            lon: city.centreLon,
            address: null,
            openingHours: null,
            latestPriceSighting: null,
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
