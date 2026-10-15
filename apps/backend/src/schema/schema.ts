import { prisma } from '@t09-project-2/db'

import { builder } from '../builder.js'
import { latestPriceSightings } from './price-sightings.js'
import type { VenueWithPriceSightings } from './price-sightings.js'

builder.prismaObject('Venue', {
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    address: t.exposeString('address'),
    openingHours: t.relation('openingHours'),
    city: t.relation('city'),
    pricesSighted: t.relation('pricesSighted'),
  }),
})

builder.prismaObject('OpeningHours', {
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

builder.prismaObject('PriceSighting', {
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

builder.queryType({
  fields: (t) => ({
    venue: t.prismaField({
      type: ['Venue'],
      resolve: async (query) => {
        const venues = await prisma.venue.findMany({ ...query })

        for (const venue of venues as VenueWithPriceSightings[]) {
          if (venue.pricesSighted) {
            venue.pricesSighted = latestPriceSightings(venue.pricesSighted)
          }
        }

        return venues
      },
    }),
  }),
})
