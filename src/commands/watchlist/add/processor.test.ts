import * as processor from "./processor"
import CacheManager from "cache/node-cache"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"
import { assertAuthor, assertTitle } from "../../../../tests/assertions/discord"
import defi from "adapters/defi"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")
jest.mock("cache/node-cache")

describe("viewWatchlist", () => {
  const interaction = mockdc.cloneCommandInteraction()
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("Found multiple similar token symbols", async () => {
    const symbols = ["eth"]
    const input = {
      msg,
      interaction,
      symbols,
      originSymbols: symbols,
      userId: msg.author.id,
    }
    jest.spyOn(defi, "addToWatchlist").mockResolvedValueOnce({
      data: {
        base_suggestions: [
          {
            id: "ethereum",
            symbol: "eth",
            name: "Ethereum",
          },
          {
            id: "ethereum-wormhole",
            symbol: "eth",
            name: "Ethereum (Wormhole)",
          },
        ],
        target_suggestions: null,
      },
      ok: true,
    } as any)
    const output = await processor.viewWatchlist(input)
    const expected = composeEmbedMessage(msg, {
      title: `<:mag:1058304336842727544> Multiple options found`,
      description:
        "Multiple tokens found for `eth`.\nPlease select one of the following",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Successful add one token", async () => {
    const symbols = ["ftm"]
    const input = {
      msg,
      interaction,
      symbols,
      originSymbols: symbols,
      userId: msg.author.id,
    }
    jest.spyOn(defi, "addToWatchlist").mockResolvedValueOnce({
      data: null,
      ok: true,
      error: null,
      log: "",
      curl: "",
      suggestion: [],
    } as any)
    CacheManager.findAndRemove = jest.fn().mockResolvedValue(null)
    const output = await processor.viewWatchlist(input)
    const expected = getSuccessEmbed({
      title: "Successfully set!",
      description:
        "**FTM** has been added successfully! Track it by `$watchlist view`.",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })

  test("Successful add multiple tokens", async () => {
    const symbols = ["ftm", "eth"]
    const input = {
      msg,
      interaction,
      symbols,
      originSymbols: symbols,
      userId: msg.author.id,
    }
    jest
      .spyOn(defi, "addToWatchlist")
      .mockResolvedValueOnce({
        data: null,
        ok: true,
        error: null,
        log: "",
        curl: "",
        suggestion: [],
      } as any)
      .mockResolvedValueOnce({
        data: null,
        ok: true,
        error: null,
        log: "",
        curl: "",
        suggestion: [],
      } as any)
    CacheManager.findAndRemove = jest.fn().mockResolvedValue(null)
    const output = await processor.viewWatchlist(input)
    const expected = getSuccessEmbed({
      title: "Successfully set!",
      description:
        "**FTM ETH** has been added successfully! Track it by `$watchlist view`.",
    })
    assertTitle(output, expected)
    assertAuthor(output, expected)
  })
})

describe("addUserWatchlist", () => {
  const msg = mockdc.cloneMessage()

  afterEach(() => jest.clearAllMocks())

  test("return data = null for add token success", async () => {
    const mockedResponse = {
      data: null,
      ok: true,
    } as any
    jest.spyOn(defi, "addToWatchlist").mockResolvedValueOnce(mockedResponse)
    const output = await processor.addUserWatchlist(msg, msg.author.id, "eth")
    expect(output).toStrictEqual(mockedResponse.data)
  })

  test("return data != null in case multiple similar symbols found", async () => {
    const mockedResponse = {
      data: {
        base_suggestions: [
          {
            id: "ethereum",
            symbol: "eth",
            name: "Ethereum",
          },
          {
            id: "ethereum-wormhole",
            symbol: "eth",
            name: "Ethereum (Wormhole)",
          },
        ],
        target_suggestions: null,
      },
      ok: true,
    } as any
    jest.spyOn(defi, "addToWatchlist").mockResolvedValueOnce(mockedResponse)
    const output = await processor.addUserWatchlist(msg, msg.author.id, "eth")
    expect(output).toStrictEqual(mockedResponse.data)
  })
})
