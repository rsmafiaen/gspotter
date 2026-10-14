import { prisma } from '../src/client.js'
import { Day, GlassSize, Limitations } from '../src/generated/prisma/client.js'

const REFERENCE_DATE = '2000-01-01'

function at(time: string) {
  return `${REFERENCE_DATE}T${time}:00+01:00`
}

async function main() {
  console.log('Seeding database...')

  await prisma.priceSighting.deleteMany()
  await prisma.openingHours.deleteMany()
  await prisma.venue.deleteMany()
  await prisma.city.deleteMany()

  await prisma.city.create({
    data: {
      name: 'Trondheim',
      centreLon: '10.3951',
      centreLat: '63.4305',
      venues: {
        create: [
          {
            name: 'Den Gode Nabo',
            address: 'Øvre Bakklandet 69',
            openingHours: {
              create: [
                {
                  days: [Day.MON, Day.TUE, Day.WED, Day.THU, Day.FRI],
                  opening: at('15:00'),
                  closing: at('23:00'),
                },
                {
                  days: [Day.SAT, Day.SUN],
                  opening: at('12:00'),
                  closing: at('22:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 165,
                  size: GlassSize.PINT,
                  limitation: [],
                },
                {
                  price: 139,
                  size: GlassSize.PINT,
                  limitation: [Limitations.TIME],
                  timeStart: at('16:00'),
                  timeEnd: at('18:00'),
                },
                {
                  price: 149,
                  size: GlassSize.HALF_LITER,
                  limitation: [Limitations.MEMBERSHIP],
                },
              ],
            },
          },
          {
            name: 'Skjenkestua',
            address: 'Nedre Bakklandet 24',
            openingHours: {
              create: [
                {
                  days: [Day.MON, Day.TUE, Day.WED, Day.THU],
                  opening: at('16:00'),
                  closing: at('23:30'),
                },
                {
                  days: [Day.FRI, Day.SAT],
                  opening: at('14:00'),
                  closing: at('23:30'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 149,
                  size: GlassSize.PINT,
                  limitation: [],
                },
                {
                  price: 89,
                  size: GlassSize.QUARTER_LITER,
                  limitation: [],
                },
              ],
            },
          },
          {
            name: 'Baklandet Skydsstation',
            address: 'Øvre Bakklandet 33',
            openingHours: {
              create: [
                {
                  days: [Day.TUE, Day.WED, Day.THU, Day.FRI, Day.SAT, Day.SUN],
                  opening: at('17:00'),
                  closing: at('23:30'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 155,
                  size: GlassSize.PINT,
                  limitation: [],
                },
                {
                  price: 135,
                  size: GlassSize.HALF_LITER,
                  limitation: [],
                },
              ],
            },
          },
          {
            name: 'Trondheim Torg Pub',
            address: 'Olav Tryggvasons gate 6',
            openingHours: {
              create: [
                {
                  days: [
                    Day.MON,
                    Day.TUE,
                    Day.WED,
                    Day.THU,
                    Day.FRI,
                    Day.SAT,
                    Day.SUN,
                  ],
                  opening: at('10:00'),
                  closing: at('20:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 159,
                  size: GlassSize.PINT,
                  limitation: [],
                },
                {
                  price: 129,
                  size: GlassSize.HALF_LITER,
                  limitation: [Limitations.MEMBERSHIP],
                },
              ],
            },
          },
        ],
      },
    },
  })

  await prisma.city.create({
    data: {
      name: 'Oslo',
      centreLon: '10.7522',
      centreLat: '59.9139',
      venues: {
        create: [
          {
            name: 'The Dubliner Folk Pub',
            address: 'Rådhusgata 13',
            openingHours: {
              create: [
                {
                  days: [
                    Day.MON,
                    Day.TUE,
                    Day.WED,
                    Day.THU,
                    Day.FRI,
                    Day.SAT,
                    Day.SUN,
                  ],
                  opening: at('14:00'),
                  closing: at('23:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 185,
                  size: GlassSize.PINT,
                  limitation: [],
                },
              ],
            },
          },
          {
            name: 'Tilt',
            address: 'Øvre Slottsgate 6',
            openingHours: {
              create: [
                {
                  days: [
                    Day.MON,
                    Day.TUE,
                    Day.WED,
                    Day.THU,
                    Day.FRI,
                    Day.SAT,
                    Day.SUN,
                  ],
                  opening: at('15:00'),
                  closing: at('23:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 175,
                  size: GlassSize.HALF_LITER,
                  limitation: [],
                },
                {
                  price: 60,
                  size: GlassSize.OTHER,
                  limitation: [],
                  sizeMl: 330,
                },
              ],
            },
          },
        ],
      },
    },
  })

  const [cities, venues, openingHours, priceSightings] = await Promise.all([
    prisma.city.count(),
    prisma.venue.count(),
    prisma.openingHours.count(),
    prisma.priceSighting.count(),
  ])

  console.log(
    `Created ${cities} cities, ${venues} venues, ${openingHours} opening hours entries, and ${priceSightings} price sightings`,
  )
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
