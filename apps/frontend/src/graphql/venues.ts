export const CREATE_REVIEW = `
  mutation CreateReview($input: MutationCreateReviewInput!) {
    createReview(input: $input) {
      id
      username
      body
      rating
      timeCreated
    }
  }
`

export const GET_VENUE = `
  query GetVenues {
    venue {
      id
      name
      address
      lat
      lon
      city {
        id
        name
        lat
        lon
      }
      openingHours {
        days
        opening
        closing
      }
      pricesSighted {
        price
        size
        sizeMl
        Limitations
        timeStart
        timeEnd
        timeSighted
      }
      reviews {
        id
        username
        body
        rating
        timeCreated
      }
    }
  }
`
