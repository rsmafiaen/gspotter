import { prisma } from '../src/client.js'
import { Day, GlassSize, Limitations } from '../src/generated/prisma/client.js'

const REFERENCE_DATE = '2000-01-01'

function at(time: string) {
  return `${REFERENCE_DATE}T${time}:00+01:00`
}

async function main() {
  console.log('Seeding database...')

  await prisma.review.deleteMany()
  await prisma.priceSighting.deleteMany()
  await prisma.openingHours.deleteMany()
  await prisma.venue.deleteMany()
  await prisma.city.deleteMany()

  await prisma.city.create({
    data: {
      name: 'Trondheim',
      centreLon: 10.3951,
      centreLat: 63.4305,
      venues: {
        create: [
          {
            name: 'Den Gode Nabo',
            address: 'Øvre Bakklandet 69',
            lat: 63.4295,
            lon: 10.3966,
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
                  timeSighted: at('18:30'),
                },
                {
                  price: 139,
                  size: GlassSize.PINT,
                  limitation: [Limitations.TIME],
                  timeStart: at('16:00'),
                  timeEnd: at('18:00'),
                  timeSighted: at('17:45'),
                },
                {
                  price: 149,
                  size: GlassSize.HALF_LITER,
                  limitation: [Limitations.MEMBERSHIP],
                  timeSighted: at('19:15'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'bakklandet_wanderer',
                  body: 'Classic Trondheim pub by the river. Great atmosphere and friendly staff!',
                  rating: 5,
                },
                {
                  username: 'beer_enthusiast',
                  body: 'Good selection, but it gets crowded on sunny days.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Skjenkestua',
            address: 'Nedre Bakklandet 24',
            lat: 63.4292,
            lon: 10.3959,
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
                  timeSighted: at('18:00'),
                },
                {
                  price: 89,
                  size: GlassSize.QUARTER_LITER,
                  limitation: [],
                  timeSighted: at('16:45'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'cozy_seeker',
                  body: 'Intimate little spot with a fireplace. Perfect for a quiet pint.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Baklandet Skydsstation',
            address: 'Øvre Bakklandet 33',
            lat: 63.4291,
            lon: 10.3962,
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
                  timeSighted: at('18:20'),
                },
                {
                  price: 135,
                  size: GlassSize.HALF_LITER,
                  limitation: [],
                  timeSighted: at('18:40'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'sunday_sipper',
                  body: 'Charming venue, but the prices are on the higher side.',
                  rating: 3,
                },
                {
                  username: 'historic_pub_fan',
                  body: 'Oldest pub on Bakklandet! A must-visit for the vibes alone.',
                  rating: 5,
                },
              ],
            },
          },
          {
            name: 'Trondheim Torg Pub',
            address: 'Olav Tryggvasons gate 6',
            lat: 63.4302,
            lon: 10.3948,
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
                  timeSighted: at('12:30'),
                },
                {
                  price: 129,
                  size: GlassSize.HALF_LITER,
                  limitation: [Limitations.MEMBERSHIP],
                  timeSighted: at('13:15'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'city_center_local',
                  body: 'Convenient location, but nothing special. Fine for a quick one.',
                  rating: 3,
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
      centreLon: 10.7522,
      centreLat: 59.9139,
      venues: {
        create: [
          {
            name: 'The Dubliner Folk Pub',
            address: 'Rådhusgata 13',
            lat: 59.9114,
            lon: 10.7405,
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
                  timeSighted: at('20:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'dubliner_regular',
                  body: 'Live music every weekend! Feels like a little slice of Ireland.',
                  rating: 5,
                },
                {
                  username: 'oslo_nightowl',
                  body: 'Great selection of stouts, though a bit pricey even for Oslo.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Tilt',
            address: 'Øvre Slottsgate 6',
            lat: 59.9139,
            lon: 10.7432,
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
                  timeSighted: at('19:30'),
                },
                {
                  price: 60,
                  size: GlassSize.OTHER,
                  limitation: [],
                  sizeMl: 330,
                  timeSighted: at('21:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'arcade_addict',
                  body: 'Retro games and craft beer, what more could you want?',
                  rating: 5,
                },
              ],
            },
          },
        ],
      },
    },
  })

  const [cities, venues, openingHours, priceSightings, reviews] =
    await Promise.all([
      prisma.city.count(),
      prisma.venue.count(),
      prisma.openingHours.count(),
      prisma.priceSighting.count(),
      prisma.review.count(),
    ])

  console.log(
    `Created ${cities} cities, ${venues} venues, ${openingHours} opening hours entries, ${priceSightings} price sightings, and ${reviews} reviews`,
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
