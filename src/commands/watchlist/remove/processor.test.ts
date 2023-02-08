import { CommandInteraction, Message } from "discord.js"
import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
jest.mock("adapters/defi")
jest.mock("cache/node-cache")

describe("addWatchlistNftCollection", () => {
  const interaction = {} as unknown as CommandInteraction
  const msg = {
    author: {
      id: "123123",
      avatarURL: jest.fn().mockReturnValueOnce("abc"),
    },
    type: "DEFAULT",
  } as unknown as Message

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
