import Discord, { HexColorString, MessageOptions } from "discord.js"
import { mockClient } from "../../../../tests/mocks"
import { commands } from "commands"
import CacheManager from "cache/node-cache"
import { composeEmbedMessage } from "ui/discord/embed"
import { getChartColorConfig } from "ui/canvas/color"
import { APIError, InternalError } from "errors"
import { RunResult } from "types/common"
import defi from "adapters/defi"

jest.mock("adapters/defi")
const commandKey = "ticker"

describe("ticker", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()

  if (!commands[commandKey]) return
  const command = commands[commandKey]

  const btcValue = {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    market_cap_rank: 1,
    image: {
      small: "small",
    },
    market_data: {
      current_price: {
        usd: 19051,
      },
      market_cap: {
        usd: 365344809433,
      },
      price_change_percentage_1h_in_currency: {
        usd: 0.0716,
      },
      price_change_percentage_24h_in_currency: {
        usd: 0.00722,
      },
      price_change_percentage_7d_in_currency: {
        usd: -6.35987,
      },
    },
  }

  test("ticker btc successfully", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker btc",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])
    const cacheSearchCoinRes = {
      ok: true,
      data: [
        {
          id: "bitcoin",
          symbol: "btc",
          name: "Bitcoin",
        },
      ],
    }
    const cacheGetCoinRes = {
      ok: true,
      data: btcValue,
    }
    const cacheChartRes = {
      ok: true,
      data: {
        timestamps: null,
        prices: [10, 10, 10, 11, 12, 12, 13],
        times: [
          "10-05",
          "10-06",
          "10-07",
          "10-08",
          "10-09",
          "10-09",
          "10-10",
          "10-11",
          "10-12",
        ],
        from: "October 05, 2022",
        to: "October 12, 2022",
      },
    }
    const wlRes = {
      data: {
        metadata: { page: 0, size: 12, total: 1 },
        data: [{ id: "fantom", symbol: "ftm", is_default: false }],
      },
    }
    CacheManager.get = jest
      .fn()
      .mockResolvedValueOnce(cacheSearchCoinRes)
      .mockResolvedValueOnce(cacheGetCoinRes)
      .mockResolvedValueOnce(cacheChartRes)
    defi.getUserWatchlist = jest.fn().mockResolvedValueOnce(wlRes)
    const expected = composeEmbedMessage(msg, {
      color: getChartColorConfig(cacheGetCoinRes.data.id)
        .borderColor as HexColorString,
      author: [cacheGetCoinRes.data.name, cacheGetCoinRes.data.image.small],
    })

    const output = await command.run(msg)
    expect(CacheManager.get).toHaveBeenCalledTimes(3)
    expect(expected.color).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].color
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
  })

  test("ticker bayc/btc successfully", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker bayc/btc",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])

    const compareCacheRes = {
      ok: true,
      data: {
        target_coin: btcValue,
        base_coin: {
          id: "bayc-vault-nftx",
          name: "BAYC Vault (NFTX)",
          symbol: "bayc",
          market_cap_rank: 0,
          image: {
            small: "small",
          },
          market_data: {
            current_price: {
              usd: 19051,
            },
            market_cap: {
              usd: 365344809433,
            },
            price_change_percentage_1h_in_currency: {
              usd: 0.0716,
            },
            price_change_percentage_24h_in_currency: {
              usd: 0.00722,
            },
            price_change_percentage_7d_in_currency: {
              usd: -6.35987,
            },
          },
        },
        ratios: [
          0.23671477971857052, 0.2376117470495763, 0.23417028521738475,
          0.24052481144154256, 0.23938681219493868, 0.24190069261665326,
          0.2414246602930742, 0.24437032470757378, 0.24141984532477118,
          0.2407701587477975, 0.24007495509060764, 0.24476311664379502,
          0.24742069485186352, 0.24815506035363777, 0.2433214415785997,
          0.25849706603787087, 0.25778059462685304, 0.26167239319633606,
          0.25720438227176196,
        ],
        times: [
          "10-05",
          "10-05",
          "10-05",
          "10-06",
          "10-06",
          "10-06",
          "10-06",
          "10-06",
          "10-06",
          "10-07",
          "10-07",
          "10-07",
          "10-07",
          "10-07",
          "10-07",
          "10-08",
          "10-08",
          "10-08",
          "10-08",
        ],
        base_coin_suggestions: null,
        target_coin_suggestions: null,
        from: "October 05, 2022",
        to: "October 12, 2022",
      },
    }

    CacheManager.get = jest.fn().mockResolvedValueOnce(compareCacheRes)
    const expected = composeEmbedMessage(msg, {
      color: getChartColorConfig().borderColor as HexColorString,
      author: [`BAYC Vault (NFTX) vs. Bitcoin`],
      footer: ["Data fetched from CoinGecko.com"],
      description: `**Ratio**: \`${
        compareCacheRes.data.ratios[compareCacheRes.data.ratios.length - 1]
      }\``,
    })

    const output = await command.run(msg)

    expect(CacheManager.get).toHaveBeenCalled()
    expect(expected.color).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].color
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("fail API", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker btc",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])
    const res = {
      ok: false,
      data: null,
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    try {
      await command.run(msg)
    } catch (e) {
      expect(CacheManager.get).toHaveBeenCalled()
      expect(e).toBeInstanceOf(APIError)
    }
  })

  test("no token found", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker abc",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])
    const res = {
      ok: true,
      data: null,
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    try {
      await command.run(msg)
    } catch (e) {
      expect(CacheManager.get).toHaveBeenCalled()
      expect(e).toBeInstanceOf(InternalError)
    }
  })

  test("ticker cmm/btc not found cmm", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker cmm/btc",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])

    const res = {
      ok: false,
      data: null,
      error: "coin cmm not found",
    }

    CacheManager.get = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(CacheManager.get).toHaveBeenCalled()
      expect(e).toBeInstanceOf(InternalError)
    }
  })
})
