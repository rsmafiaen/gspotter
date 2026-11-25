/* eslint-disable */
import type { Prisma, Venue, OpeningHours, OpeningHoursNote, City, PriceSighting, Review } from "./prisma/client.js";
import type { PothosPrismaDatamodel } from "@pothos/plugin-prisma";
export default interface PrismaTypes {
    Venue: {
        Name: "Venue";
        Shape: Venue;
        Include: Prisma.VenueInclude;
        Select: Prisma.VenueSelect;
        OrderBy: Prisma.VenueOrderByWithRelationInput;
        WhereUnique: Prisma.VenueWhereUniqueInput;
        Where: Prisma.VenueWhereInput;
        Create: {};
        Update: {};
        RelationName: "openingHours" | "openingHoursNotes" | "city" | "pricesSighted" | "reviews";
        ListRelations: "openingHours" | "openingHoursNotes" | "pricesSighted" | "reviews";
        Relations: {
            openingHours: {
                Shape: OpeningHours[];
                Name: "OpeningHours";
                Nullable: false;
            };
            openingHoursNotes: {
                Shape: OpeningHoursNote[];
                Name: "OpeningHoursNote";
                Nullable: false;
            };
            city: {
                Shape: City;
                Name: "City";
                Nullable: false;
            };
            pricesSighted: {
                Shape: PriceSighting[];
                Name: "PriceSighting";
                Nullable: false;
            };
            reviews: {
                Shape: Review[];
                Name: "Review";
                Nullable: false;
            };
        };
    };
    OpeningHours: {
        Name: "OpeningHours";
        Shape: OpeningHours;
        Include: Prisma.OpeningHoursInclude;
        Select: Prisma.OpeningHoursSelect;
        OrderBy: Prisma.OpeningHoursOrderByWithRelationInput;
        WhereUnique: Prisma.OpeningHoursWhereUniqueInput;
        Where: Prisma.OpeningHoursWhereInput;
        Create: {};
        Update: {};
        RelationName: "venue";
        ListRelations: never;
        Relations: {
            venue: {
                Shape: Venue;
                Name: "Venue";
                Nullable: false;
            };
        };
    };
    OpeningHoursNote: {
        Name: "OpeningHoursNote";
        Shape: OpeningHoursNote;
        Include: Prisma.OpeningHoursNoteInclude;
        Select: Prisma.OpeningHoursNoteSelect;
        OrderBy: Prisma.OpeningHoursNoteOrderByWithRelationInput;
        WhereUnique: Prisma.OpeningHoursNoteWhereUniqueInput;
        Where: Prisma.OpeningHoursNoteWhereInput;
        Create: {};
        Update: {};
        RelationName: "venue";
        ListRelations: never;
        Relations: {
            venue: {
                Shape: Venue;
                Name: "Venue";
                Nullable: false;
            };
        };
    };
    City: {
        Name: "City";
        Shape: City;
        Include: Prisma.CityInclude;
        Select: Prisma.CitySelect;
        OrderBy: Prisma.CityOrderByWithRelationInput;
        WhereUnique: Prisma.CityWhereUniqueInput;
        Where: Prisma.CityWhereInput;
        Create: {};
        Update: {};
        RelationName: "venues";
        ListRelations: "venues";
        Relations: {
            venues: {
                Shape: Venue[];
                Name: "Venue";
                Nullable: false;
            };
        };
    };
    PriceSighting: {
        Name: "PriceSighting";
        Shape: PriceSighting;
        Include: Prisma.PriceSightingInclude;
        Select: Prisma.PriceSightingSelect;
        OrderBy: Prisma.PriceSightingOrderByWithRelationInput;
        WhereUnique: Prisma.PriceSightingWhereUniqueInput;
        Where: Prisma.PriceSightingWhereInput;
        Create: {};
        Update: {};
        RelationName: "venue";
        ListRelations: never;
        Relations: {
            venue: {
                Shape: Venue;
                Name: "Venue";
                Nullable: false;
            };
        };
    };
    Review: {
        Name: "Review";
        Shape: Review;
        Include: Prisma.ReviewInclude;
        Select: Prisma.ReviewSelect;
        OrderBy: Prisma.ReviewOrderByWithRelationInput;
        WhereUnique: Prisma.ReviewWhereUniqueInput;
        Where: Prisma.ReviewWhereInput;
        Create: {};
        Update: {};
        RelationName: "venue";
        ListRelations: never;
        Relations: {
            venue: {
                Shape: Venue;
                Name: "Venue";
                Nullable: false;
            };
        };
    };
}
export function getDatamodel(): PothosPrismaDatamodel { return JSON.parse("{\"datamodel\":{\"models\":{\"Venue\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"address\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"lat\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"lon\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"OpeningHours\",\"kind\":\"object\",\"name\":\"openingHours\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"OpeningHoursToVenue\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"OpeningHoursNote\",\"kind\":\"object\",\"name\":\"openingHoursNotes\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"OpeningHoursNoteToVenue\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"cityId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"City\",\"kind\":\"object\",\"name\":\"city\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CityToVenue\",\"relationFromFields\":[\"cityId\"],\"isUpdatedAt\":false},{\"type\":\"PriceSighting\",\"kind\":\"object\",\"name\":\"pricesSighted\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"PriceSightingToVenue\",\"relationFromFields\":[],\"isUpdatedAt\":false},{\"type\":\"Review\",\"kind\":\"object\",\"name\":\"reviews\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewToVenue\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"OpeningHours\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"Day\",\"kind\":\"enum\",\"name\":\"days\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"opening\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"closing\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"venueId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Venue\",\"kind\":\"object\",\"name\":\"venue\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"OpeningHoursToVenue\",\"relationFromFields\":[\"venueId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"OpeningHoursNote\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"Day\",\"kind\":\"enum\",\"name\":\"days\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"note\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"venueId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Venue\",\"kind\":\"object\",\"name\":\"venue\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"OpeningHoursNoteToVenue\",\"relationFromFields\":[\"venueId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"City\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"name\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"displayName\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"centreLon\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"centreLat\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Venue\",\"kind\":\"object\",\"name\":\"venues\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"CityToVenue\",\"relationFromFields\":[],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"PriceSighting\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"price\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"GlassSize\",\"kind\":\"enum\",\"name\":\"size\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Limitations\",\"kind\":\"enum\",\"name\":\"limitation\",\"isRequired\":true,\"isList\":true,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"timeStart\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"timeEnd\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Float\",\"kind\":\"scalar\",\"name\":\"sizeMl\",\"isRequired\":false,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"timeSighted\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"venueId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Venue\",\"kind\":\"object\",\"name\":\"venue\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"PriceSightingToVenue\",\"relationFromFields\":[\"venueId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]},\"Review\":{\"fields\":[{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"id\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":true,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"username\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"body\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Int\",\"kind\":\"scalar\",\"name\":\"rating\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"DateTime\",\"kind\":\"scalar\",\"name\":\"timeCreated\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":true,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"String\",\"kind\":\"scalar\",\"name\":\"venueId\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"isUpdatedAt\":false},{\"type\":\"Venue\",\"kind\":\"object\",\"name\":\"venue\",\"isRequired\":true,\"isList\":false,\"hasDefaultValue\":false,\"isUnique\":false,\"isId\":false,\"relationName\":\"ReviewToVenue\",\"relationFromFields\":[\"venueId\"],\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueIndexes\":[]}}}}"); }