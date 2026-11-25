export const DELETE_REVIEW = `
  mutation DeleteReview($id: String!) {
    deleteReview(id: $id)
  }
`

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
