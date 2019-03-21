import { runQuery } from "test/utils"
import gql from "lib/gql"
import { ResolverContext } from "types/graphql"

describe("PricingContext type", () => {
  const pricingContextLoader = jest.fn(({ dimensions }) =>
    Promise.resolve({
      filterDescription: `${dimensions} mocks by David Sheldrick`,
      bins: [
        {
          maxPriceCents: 8855,
          minPriceCents: 900,
          numArtworks: 67,
        },
        {
          maxPriceCents: 16810,
          minPriceCents: 8855,
          numArtworks: 57,
        },
        {
          maxPriceCents: 24765,
          minPriceCents: 16810,
          numArtworks: 45,
        },
        {
          maxPriceCents: 32720,
          minPriceCents: 24765,
          numArtworks: 17,
        },
      ],
    })
  )
  const smallArtworkDimensions = {
    width_cm: 1,
    height_cm: 1,
  }
  const mediumArtworkDimensions = {
    width_cm: 70,
    height_cm: 69,
  }
  const largeArtworkDimensions = {
    width_cm: 70,
    height_cm: 71,
  }
  const artwork = {
    ...smallArtworkDimensions,
    category: "Painting",
    price_cents: [234],
    artist: {
      _id: "artist-id",
      id: "artist-slug",
    },
    price_hidden: false,
  }
  const meLoader = jest.fn(() =>
    Promise.resolve({
      lab_features: [
        "Some lab feature",
        "Pricing Context",
        "Some other lab feature",
      ],
    })
  )
  const artworkLoader = jest.fn(() => Promise.resolve(artwork))
  const context: Partial<ResolverContext> = {
    meLoader,
    artworkLoader,
    pricingContextLoader,
  }
  const query = gql`
    query {
      artwork(id: "lol") {
        pricingContext {
          filterDescription
          bins {
            maxPriceCents
            minPriceCents
            numArtworks
          }
        }
      }
    }
  `

  describe("PricingContext type", () => {
    it("is accessible through the artwork type", async () => {
      const result = await runQuery(query, context)
      expect(result).toMatchInlineSnapshot(`
Object {
  "artwork": Object {
    "pricingContext": Object {
      "bins": Array [
        Object {
          "maxPriceCents": 8855,
          "minPriceCents": 900,
          "numArtworks": 67,
        },
        Object {
          "maxPriceCents": 16810,
          "minPriceCents": 8855,
          "numArtworks": 57,
        },
        Object {
          "maxPriceCents": 24765,
          "minPriceCents": 16810,
          "numArtworks": 45,
        },
        Object {
          "maxPriceCents": 32720,
          "minPriceCents": 24765,
          "numArtworks": 17,
        },
      ],
      "filterDescription": "SMALL mocks by David Sheldrick",
    },
  },
}
`)
      expect(pricingContextLoader.mock.calls[0][0]).toMatchInlineSnapshot(`
Object {
  "artistId": "artist-id",
  "category": "PAINTING",
  "dimensions": "SMALL",
  "listPriceCents": 234,
}
`)
    })
    it("correctly handles medium artworks", async () => {
      artworkLoader.mockResolvedValueOnce({
        ...artwork,
        ...mediumArtworkDimensions,
      })
      const result = (await runQuery(query, context)) as any
      expect(
        result.artwork.pricingContext.filterDescription
      ).toMatchInlineSnapshot(`"MEDIUM mocks by David Sheldrick"`)
    })
    it("correctly handles large artworks", async () => {
      artworkLoader.mockResolvedValueOnce({
        ...artwork,
        ...largeArtworkDimensions,
      })
      const result = (await runQuery(query, context)) as any
      expect(
        result.artwork.pricingContext.filterDescription
      ).toMatchInlineSnapshot(`"LARGE mocks by David Sheldrick"`)
    })
    it("is null when dimensions not present", async () => {
      const { width_cm, height_cm, ...others } = artwork
      artworkLoader.mockResolvedValueOnce(others)
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when artist details are not present", async () => {
      const { artist, ...others } = artwork
      artworkLoader.mockResolvedValueOnce(others)
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })

    it("is null when category is not present", async () => {
      const { category, ...others } = artwork
      artworkLoader.mockResolvedValueOnce(others)
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when list price is not present", async () => {
      const { price_cents, ...others } = artwork
      artworkLoader.mockResolvedValueOnce(others)
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when list price is/starts-at 0", async () => {
      artworkLoader.mockResolvedValueOnce({
        ...artwork,
        price_cents: [0],
      })
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when list price is not public", async () => {
      artworkLoader.mockResolvedValueOnce({
        ...artwork,
        price_hidden: true,
      })
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when not authenticated", async () => {
      const { meLoader, ...others } = context
      const result = (await runQuery(query, others)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when user is not in lab feature", async () => {
      meLoader.mockResolvedValueOnce({
        lab_features: ["some other lab feature"],
      })
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
    it("is null when user has no lab features", async () => {
      meLoader.mockResolvedValueOnce({
        lab_features: [],
      })
      const result = (await runQuery(query, context)) as any
      expect(result.artwork.pricingContext).toBeNull()
    })
  })
})
