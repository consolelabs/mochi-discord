import { HexColorString } from "discord.js"
import * as processor from "./processor"
import { APIError, InternalError } from "errors"
import CacheManager from "cache/node-cache"
import { assertDescription } from "../../../../tests/assertions/discord"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("turndown")
jest.mock("cache/node-cache")
jest.mock("adapters/defi")
jest.mock("adapters/config")
jest.mock("ui/discord/select-menu")
jest.mock("ui/discord/button")

describe("handleTokenInfo", () => {
  const msg = mockdc.cloneMessage()

  beforeEach(() => jest.clearAllMocks())

  test("API Error when call searchCoins", async () => {
    const cacheGetRes = {
      data: null,
      ok: false,
      curl: "",
      log: "",
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(cacheGetRes)
    await expect(processor.handleTokenInfo(msg, "ftm")).rejects.toThrow(
      APIError
    )
  })

  test("coin not found", async () => {
    const cacheGetRes = {
      data: [],
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(cacheGetRes)
    await expect(processor.handleTokenInfo(msg, "ftm")).rejects.toThrow(
      InternalError
    )
    expect(CacheManager.get).toHaveBeenCalledTimes(1)
  })

  test("coin.length === 1", async () => {
    const searchCoinsRes = {
      data: [
        {
          id: 1,
          symbol: "btc",
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    const getCoinRes = {
      data: {
        name: "Bitcoin",
        id: "bitcoin",
        description: {
          en: "",
        },
        image: {
          large: "",
        },
      },
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest
      .fn()
      .mockResolvedValueOnce(searchCoinsRes)
      .mockResolvedValueOnce(getCoinRes)
    const output = await processor.handleTokenInfo(msg, "ftm")
    const coin = getCoinRes.data
    const expectEmbed = composeEmbedMessage(null, {
      thumbnail: coin.image.large,
      color: getChartColorConfig(coin.id).borderColor as HexColorString,
      title: "About " + coin.name,
      footer: ["Data fetched from CoinGecko.com"],
      description: "This token has not updated description yet",
    })
    expect(CacheManager.get).toHaveBeenCalledTimes(2)
    assertDescription(output as any, expectEmbed)
  })

  test("coin.length > 1", async () => {
    const searchCoinsRes = {
      data: [
        {
          id: 1,
          symbol: "SOL",
        },
        {
          id: 1,
          symbol: "BTC",
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    const getGuildDefaultTickerRes = {
      data: {
        default_ticker: "SOL",
      },
      ok: true,
      curl: "",
      log: "",
    }
    const getCoinRes = {
      data: {
        name: "Solana",
        id: "SOL",
        description: {
          en: "",
        },
        image: {
          large: "",
        },
      },
      ok: true,
      curl: "",
      log: "",
    }
    CacheManager.get = jest
      .fn()
      .mockResolvedValueOnce(searchCoinsRes)
      .mockResolvedValueOnce(getGuildDefaultTickerRes)
      .mockResolvedValueOnce(getCoinRes)
    const output = await processor.handleTokenInfo(msg, "ftm")
    const coin = getCoinRes.data
    const expectEmbed = composeEmbedMessage(null, {
      thumbnail: coin.image.large,
      color: getChartColorConfig(coin.id).borderColor as HexColorString,
      title: "About " + coin.name,
      footer: ["Data fetched from CoinGecko.com"],
      description: "This token has not updated description yet",
    })
    expect(CacheManager.get).toHaveBeenCalledTimes(3)
    assertDescription(output as any, expectEmbed)
  })

  test("default ticker not found", async () => {
    const searchCoinsRes = {
      data: [
        {
          id: 1,
          symbol: "SOL",
        },
        {
          id: 1,
          symbol: "BTC",
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    const getGuildDefaultTickerRes = {
      data: null,
      ok: false,
      curl: "",
      log: "",
    }
    CacheManager.get = jest
      .fn()
      .mockResolvedValueOnce(searchCoinsRes)
      .mockResolvedValueOnce(getGuildDefaultTickerRes)
    const output = await processor.handleTokenInfo(msg, "btc")
    expect(CacheManager.get).toHaveBeenCalledTimes(2)
    expect((output as any)?.ambiguousResultText).toStrictEqual("BTC")
    expect((output as any)?.select?.options?.length).toStrictEqual(2)
  })
})
