import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")
jest.mock("cache/node-cache")

describe("removeWatchlistToken", () => {
  const interaction = mockdc.cloneCommandInteraction()
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("Successful add one collection symbol with Message", async () => {
    const input = {
      msgOrInteraction: msg,
      symbol: "ftm",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "removeFromWatchlist").mockResolvedValueOnce({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistToken(input)
    const expected = getSuccessEmbed({})
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Successful add one collection symbol with Interaction", async () => {
    const input = {
      msgOrInteraction: interaction,
      symbol: "ftm",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "removeFromWatchlist").mockResolvedValueOnce({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistToken(input)
    const expected = getSuccessEmbed({})
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})
