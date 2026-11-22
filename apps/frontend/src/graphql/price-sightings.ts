export const CREATE_PRICE_SIGHTING = `
  mutation CreatePriceSighting($input: MutationCreatePriceSightingInput!) {
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
`
