import { CommandInteraction, Message } from "discord.js"
import * as processor from "./processor"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
import { defaultEmojis } from "utils/common"
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
      symbol: "rabby",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "addNFTToWatchlist").mockResolvedValueOnce({
      data: null,
      ok: true,
    } as any)
    const output = await processor.addWatchlistNftCollection(input)
    const expected = getSuccessEmbed({
      title: "Successfully set!",
      description:
        "rabby has been added successfully! To see your watchlist use `$wl view`",
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
    jest.spyOn(defi, "addNFTToWatchlist").mockResolvedValueOnce({
      data: null,
      ok: true,
    } as any)
    const output = await processor.addWatchlistNftCollection(input)
    const expected = getSuccessEmbed({
      title: "Successfully set!",
      description:
        "rabby has been added successfully! To see your watchlist use `$wl view`",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Not found input symbol but suggestion", async () => {
    const input = {
      msgOrInteraction: msg,
      symbol: "rabb",
      userId: msg.author.id,
    }
    jest.spyOn(defi, "addNFTToWatchlist").mockResolvedValueOnce({
      data: {
        suggestions: [
          {
            name: "rabby",
            symbol: "rabby",
            address: "0xabcabc",
            chain: "eth",
            chain_id: 1,
          },
        ],
      },
      ok: true,
    } as any)
    const output = await processor.addWatchlistNftCollection(input)
    const expected = composeEmbedMessage(input.msgOrInteraction, {
      title: `${defaultEmojis.MAG} Multiple options found`,
      description:
        "Multiple collections found for `rabb`: **rabby** (rabby).\nPlease select one of the following",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})
