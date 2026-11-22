export const CITY_SEARCH = `
  query CitySearch($name: String!) {
    city(name: $name) {
      id
      name
      lat
      lon
    }
  }
`
