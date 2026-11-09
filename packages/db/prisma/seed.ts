import { prisma } from '../src/client.js'
import { Day, GlassSize, Limitations } from '../src/generated/prisma/client.js'

const REFERENCE_DATE = '2000-01-01'
const PRICE_DATE = '2026-11-09'

function at(time: string) {
  return `${REFERENCE_DATE}T${time}:00+01:00`
}

function priceAt(time: string) {
  return `${PRICE_DATE}T${time}:00+01:00`
}

async function main() {
  console.log('Seeding database...')

  await prisma.review.deleteMany()
  await prisma.priceSighting.deleteMany()
  await prisma.openingHours.deleteMany()
  await prisma.openingHoursNote.deleteMany()
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
            address: 'Øvre Bakklandet 66',
            lat: 63.42794,
            lon: 10.40268,
            openingHours: {
              create: [
                {
                  days: [Day.MON],
                  opening: at('16:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.TUE, Day.WED],
                  opening: at('16:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.THU, Day.FRI, Day.SAT],
                  opening: at('15:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.SUN],
                  opening: at('15:00'),
                  closing: at('00:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 169,
                  size: GlassSize.HALF_LITER,
                  limitation: [],
                  timeSighted: priceAt('18:30'),
                },
                {
                  price: 85,
                  size: GlassSize.QUARTER_LITER,
                  limitation: [],
                  timeSighted: priceAt('18:35'),
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
            name: 'Studentersamfundet (Daglighallen)',
            address: 'Elgeseter gate 1',
            lat: 63.422339,
            lon: 10.395522,
            openingHours: {
              create: [
                {
                  days: [Day.MON, Day.TUE],
                  opening: at('18:00'),
                  closing: at('23:00'),
                },
                {
                  days: [Day.WED, Day.THU],
                  opening: at('19:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.FRI],
                  opening: at('19:00'),
                  closing: at('02:00'),
                },
                {
                  days: [Day.SAT],
                  opening: at('20:00'),
                  closing: at('02:00'),
                },
              ],
            },
            openingHoursNotes: {
              create: [
                {
                  days: [Day.SUN],
                  note: 'Open during select sports broadcasts.',
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 129,
                  size: GlassSize.PINT,
                  limitation: [Limitations.MEMBERSHIP],
                  timeSighted: priceAt('19:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'student_samfund',
                  body: 'The round red building is a Trondheim institution. Cheap member prices and a great atmosphere.',
                  rating: 5,
                },
                {
                  username: 'edgar_regular',
                  body: 'Solid spot for a pint before a concert. Can get busy on Wednesdays.',
                  rating: 4,
                },
                {
                  username: 'utdannet_ol',
                  body: 'Great place to meet fellow students, though the queue can be long on Fridays.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Three Lions English Pub',
            address: 'Brattørgata 12B',
            lat: 63.43409,
            lon: 10.40114,
            openingHours: {
              create: [
                {
                  days: [Day.MON],
                  opening: at('13:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.TUE, Day.WED],
                  opening: at('12:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.THU, Day.FRI, Day.SAT],
                  opening: at('12:00'),
                  closing: at('02:00'),
                },
                {
                  days: [Day.SUN],
                  opening: at('12:00'),
                  closing: at('00:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'matchday_mate',
                  body: 'Best place in town to watch the football. Proper English pub atmosphere.',
                  rating: 5,
                },
                {
                  username: 'bitter_og_burger',
                  body: 'Good selection of beers and solid pub grub. Gets packed when Liverpool play.',
                  rating: 4,
                },
                {
                  username: 'brattora_local',
                  body: 'Friendly staff, but the prices are a bit steep even for Trondheim.',
                  rating: 3,
                },
              ],
            },
          },
          {
            name: 'Cafe Dublin',
            address: 'Kongens gate 15',
            lat: 63.43039,
            lon: 10.39259,
            openingHours: {
              create: [
                {
                  days: [Day.MON],
                  opening: at('15:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.TUE, Day.WED, Day.THU],
                  opening: at('13:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.FRI],
                  opening: at('13:00'),
                  closing: at('02:00'),
                },
                {
                  days: [Day.SAT],
                  opening: at('12:00'),
                  closing: at('02:00'),
                },
                {
                  days: [Day.SUN],
                  opening: at('15:00'),
                  closing: at('00:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'irish_in_trondheim',
                  body: 'Feels like a proper Irish pub. Live music and a great pint.',
                  rating: 5,
                },
                {
                  username: 'kongens_gate_regular',
                  body: 'Cosy atmosphere and friendly staff. A good spot for a quiet pint during the week.',
                  rating: 4,
                },
                {
                  username: 'quiz_goer',
                  body: 'Fun quiz nights and a decent Guinness. Can get loud later in the evening.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Sukkerhuset',
            address: 'Sverres gate 15',
            lat: 63.42859,
            lon: 10.38974,
            openingHours: {
              create: [
                {
                  days: [Day.THU],
                  opening: at('18:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.FRI],
                  opening: at('19:00'),
                  closing: at('01:30'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 89,
                  size: GlassSize.BOX,
                  limitation: [],
                  timeSighted: priceAt('20:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'studentpub_fan',
                  body: "Cheap box beer and a great student atmosphere. Can't beat it.",
                  rating: 5,
                },
                {
                  username: 'kalvskinnet_kid',
                  body: 'A hidden gem for students. Only open two days a week, so plan ahead.',
                  rating: 4,
                },
                {
                  username: 'frivillig_med',
                  body: 'Run by volunteers and it shows in the best way. Good music and cheap drinks.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Mellomveien',
            address: 'Mellomveien 16',
            lat: 63.43795,
            lon: 10.42824,
            openingHours: {
              create: [
                {
                  days: [Day.MON, Day.TUE, Day.WED, Day.THU],
                  opening: at('18:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.FRI],
                  opening: at('16:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.SAT],
                  opening: at('13:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.SUN],
                  opening: at('13:00'),
                  closing: at('00:00'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'lademoen_local',
                  body: 'Proper neighbourhood pub with friendly regulars and good prices.',
                  rating: 5,
                },
                {
                  username: 'football_pint',
                  body: 'Great place to watch a match. Simple, unpretentious and cheap.',
                  rating: 4,
                },
                {
                  username: 'ostbyen_wanderer',
                  body: 'A bit off the beaten path, but worth the walk for the atmosphere.',
                  rating: 4,
                },
              ],
            },
          },
          {
            name: 'Kieglekroa',
            address: 'Kongens gate 30',
            lat: 63.43122,
            lon: 10.39078,
            openingHours: {
              create: [
                {
                  days: [Day.MON, Day.TUE, Day.WED],
                  opening: at('15:00'),
                  closing: at('00:00'),
                },
                {
                  days: [Day.THU],
                  opening: at('15:00'),
                  closing: at('01:00'),
                },
                {
                  days: [Day.FRI],
                  opening: at('15:00'),
                  closing: at('02:00'),
                },
                {
                  days: [Day.SAT],
                  opening: at('13:00'),
                  closing: at('02:00'),
                },
              ],
            },
            pricesSighted: {
              create: [
                {
                  price: 138,
                  size: GlassSize.QUARTER_LITER,
                  limitation: [],
                  timeSighted: priceAt('19:30'),
                },
                {
                  price: 179,
                  size: GlassSize.HALF_LITER,
                  limitation: [],
                  timeSighted: priceAt('19:35'),
                },
              ],
            },
            reviews: {
              create: [
                {
                  username: 'holstveita_historian',
                  body: "Trondheim's oldest pub for a reason. Great atmosphere and a proper pint.",
                  rating: 5,
                },
                {
                  username: 'sjoelbak_champion',
                  body: "Good beer, good company and free shuffleboard. What's not to like?",
                  rating: 4,
                },
                {
                  username: 'midtbyen_local',
                  body: 'Historic pub with a wide beer selection. Sunday closed, so plan accordingly.',
                  rating: 4,
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
