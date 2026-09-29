# G-spotter

## Idea

We want to create **G-spotter Finder**, a web application where users can find pubs and bars that serve Guinness, view them on a map, compare prices, and rate the quality of the Guinness.

Users can search for places or areas and receive a list of relevant pubs. Results can be filtered and sorted by criteria such as distance, price, and rating.

For example:

> **Trondheim Torg**

could return:

- **Pub A** — NOK 159 / pint · 0.56 L · ★ 4.3 · 350 m
- **Pub B** — NOK 129 / pint · 0.56 L · ★ 4.1 · 600 m
- **Pub C** — NOK 157 / pint · 0.5 L · ★ 3.9 · 850 m

Where the distance shown is the distance between the pub and the reference point "Trondheim Torg". If a user searches for the specific pub, it will not render the distance, as it would be 0, but then show other nearby pubs so that they can decide if they wish to go to a cheaper pub.

## Data

We will collect basic information about pubs from open sources and potentially allow users to add and update venues.

For each venue, we will store information such as:

- name and address
- geographical location
- opening hours
- whether Guinness is served
- Guinness type and serving sizes

Users can contribute:

- Guinness ratings
- comments
- price observations
- serving size information

### Prices

We will **not store a single fixed price per pub**, since prices can vary.

Instead, a price observation will contain:

- price
- volume
- type of Guinness
- any applicable conditions
- time of observation
- user who reported it

For example:

| Price | Size | Condition |
|---:|---:|---|
| NOK 159 | 0.56 L | Regular |
| NOK 129 | 0.56 L | Member price |

This allows us to display multiple prices without losing information. We can still display a clear **regular price** as the default and label special prices with their conditions.

Prices will also have timestamps so users can see how recent the information is.

## Search, Filtering and Sorting

Search will be case-insensitive and performed on the server. We will avoid unnecessary requests by using debouncing, and only showing a full list (more than 3 venues), if the user presses the search button or enter.

Users should be able to filter by:

- distance
- price
- serving size
- rating
- whether the venue is currently open

Results can be sorted by:

- distance
- price per selected volume
- rating
- number of ratings
- name
- last updated

Filtering and sorting will be performed by the backend/database rather than only on the results already loaded by the client.

For prices, we will distinguish between the **actual price** and a **normalized price**. This allows, for example, NOK 89 for 0.4 L to be compared with NOK 109 for 0.5 L by calculating the price per litre, without hiding the original price.

## Presentation

Results will primarily be presented as a list of cards for each venue. A card will display information such as:

- name
- distance
- rating
- price and serving size
- whether the price is regular or subject to a condition
- how recently the information was updated

An interactive map will complement the list.

The venue detail page will show information about the pub, available Guinness variants, prices, previous price observations, and user reviews.

## Scalability and Technology

The frontend will be built with **React, TypeScript, and Vite**, using **Tanstack Start** and it's packages for bootstrapping the project, while the backend will use **Node/TypeScript and GraphQL**. Data will be stored in **PostgreSQL on the group's VM**, using **prisma** to make interfacing with the database and backend easier.

We will use pagination/infinite scrolling so that the client does not need to load the entire dataset. Search, filtering, and sorting will be performed in the database, with relevant indexes used to ensure that the application can handle a larger number of venues and reviews.

## Accessibility and Sustainability

The result list should be usable without the map, with both keyboard and screen-reader support. We will use semantic HTML, clear focus states, sufficient contrast, and accessible forms.

To reduce resource usage, we will use pagination, caching, optimized images, and avoid loading map data unnecessarily.

## User Data

Users can submit a Guinness experience containing:

- rating
- comment
- price
- serving size
- timestamp

This provides persistent, user-generated data and allows the dataset to become increasingly up to date over time.

The goal is to create a **search and comparison service for Guinness**, built on information contributed by the community of users.
