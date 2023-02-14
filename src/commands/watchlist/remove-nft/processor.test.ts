import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")
jest.mock("cache/node-cache")

describe("addWatchlistNftCollection", () => {
  const interaction = mockdc.cloneCommandInteraction()
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("Successful add one collection symbol with Message", async () => {
    const input = {
      msgOrInteraction: msg,
      symbol: "rabby",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "removeNFTFromWatchlist").mockResolvedValueOnce({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistNftCollection(input)
    const expected = getSuccessEmbed({
      title: "Successfully remove!",
      description:
        "**RABBY** has been removed from your watchlist successfully!",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Successful add one collection symbol with Interaction", async () => {
    const input = {
      msgOrInteraction: interaction,
      symbol: "rabby",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "removeNFTFromWatchlist").mockResolvedValueOnce({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistNftCollection(input)
    const expected = getSuccessEmbed({
      title: "Successfully remove!",
      description:
        "**RABBY** has been removed from your watchlist successfully!",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})
