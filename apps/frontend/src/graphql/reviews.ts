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
