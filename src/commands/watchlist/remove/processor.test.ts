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

  test("Successful remove one collection symbol with Message", async () => {
    const input = {
      msgOrInteraction: msg,
      symbols: ["ftm", "eth"],
      userId: msg.author.id,
    }
    jest.spyOn(defi, "untrackToken").mockResolvedValue({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistToken(input)
    const expected = getSuccessEmbed({
      title: `FTM ETH has been removed from the watchlist`,
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Successful remove one collection symbol with Interaction", async () => {
    const input = {
      msgOrInteraction: interaction,
      symbols: ["ftm", "eth"],
      userId: msg.author.id,
    }
    jest.spyOn(defi, "untrackToken").mockResolvedValue({
      ok: true,
      error: null,
    } as any)
    const output = await processor.removeWatchlistToken(input)
    const expected = getSuccessEmbed({
      title: `FTM ETH has been removed from the watchlist`,
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})
