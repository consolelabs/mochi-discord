import * as processor from "./processor"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
import { getEmoji } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")
jest.mock("cache/node-cache")

describe("addWatchlistNftCollection", () => {
  const msg = mockdc.cloneMessage()
  const interaction = mockdc.cloneCommandInteraction()

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
    const expected = composeEmbedMessage(null, {
      title: `${getEmoji("MAG")} Multiple options found`,
      description:
        "Multiple collections found for `rabb`: **rabby** (rabby).\nPlease select one of the following",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})
