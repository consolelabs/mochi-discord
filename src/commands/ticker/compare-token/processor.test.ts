import CacheManager from "cache/node-cache"
import Discord, { HexColorString, MessageOptions } from "discord.js"
import { InternalError } from "errors"
import { RunResult } from "types/common"
import { getChartColorConfig } from "ui/canvas/color"
import { composeEmbedMessage } from "ui/discord/embed"
import { composeTokenComparisonEmbed } from "./processor"

jest.mock("adapters/defi")

describe("composeTokenComparisonEmbed", () => {
  test("success", async () => {
    const guildId = Discord.SnowflakeUtil.generate()
    const userId = Discord.SnowflakeUtil.generate()
    const baseQ = "btc"
    const targQ = "eth"
    const compareTokensResponse = {
      ok: true,
      data: {
        base_coin: {
          id: "ethereum",
          name: "Ethereum",
          symbol: "eth",
          market_cap_rank: 2,
          asset_platform_id: "",
          image: {
            thumb:
              "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880",
            small:
              "https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880",
            large:
              "https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880",
          },
          market_data: {
            current_price: {
              usd: 1637.74,
            },
            market_cap: {
              usd: 197311531168,
            },
            price_change_percentage_1h_in_currency: {
              usd: -0.11661,
            },
            price_change_percentage_24h_in_currency: {
              usd: 2.15736,
            },
            price_change_percentage_7d_in_currency: {
              usd: -2.53727,
            },
          },
          tickers: [
            {
              base: "ETH",
              target: "BTC",
              last: 0.06998,
              coin_id: "ethereum",
              target_coin_id: "bitcoin",
            },
          ],
          description: {
            en: "Ethereum is a global, open-source platform for decentralized applications. In other words, the vision is to create a world computer that anyone can build applications in a decentralized manner; while all states and data are distributed and publicly accessible. Ethereum supports smart contracts in which developers can write code in order to program digital value. Examples of decentralized apps (dapps) that are built on Ethereum includes tokens, non-fungible tokens, decentralized finance apps, lending protocol, decentralized exchanges, and much more.\r\n\r\nOn Ethereum, all transactions and smart contract executions require a small fee to be paid. This fee is called Gas. In technical terms, Gas refers to the unit of measure on the amount of computational effort required to execute an operation or a smart contract. The more complex the execution operation is, the more gas is required to fulfill that operation. Gas fees are paid entirely in Ether (ETH), which is the native coin of the blockchain. The price of gas can fluctuate from time to time depending on the network demand.",
          },
        },
        target_coin: {
          id: "bitcoin",
          name: "Bitcoin",
          symbol: "btc",
          market_cap_rank: 1,
          asset_platform_id: "",
          image: {
            thumb:
              "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png?1547033579",
            small:
              "https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1547033579",
            large:
              "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
          },
          market_data: {
            current_price: {
              usd: 23396,
            },
            market_cap: {
              usd: 451502127078,
            },
            price_change_percentage_1h_in_currency: {
              usd: -0.05047,
            },
            price_change_percentage_24h_in_currency: {
              usd: 0.67734,
            },
            price_change_percentage_7d_in_currency: {
              usd: -3.65749,
            },
          },
          tickers: [
            {
              base: "ETH",
              target: "BTC",
              last: 0.07004499,
              coin_id: "ethereum",
              target_coin_id: "bitcoin",
            },
          ],
          description: {
            en: 'Bitcoin is the first successful internet money based on peer-to-peer technology; whereby no central bank or authority is involved in the transaction and production of the Bitcoin currency. It was created by an anonymous individual/group under the name, Satoshi Nakamoto. The source code is available publicly as an open source project, anybody can look at it and be part of the developmental process.\r\n\r\nBitcoin is changing the way we see money as we speak. The idea was to produce a means of exchange, independent of any central authority, that could be transferred electronically in a secure, verifiable and immutable way. It is a decentralized peer-to-peer internet currency making mobile payment easy, very low transaction fees, protects your identity, and it works anywhere all the time with no central authority and banks.\r\n\r\nBitcoin is designed to have only 21 million BTC ever created, thus making it a deflationary currency. Bitcoin uses the <a href="https://www.coingecko.com/en?hashing_algorithm=SHA-256">SHA-256</a> hashing algorithm with an average transaction confirmation time of 10 minutes. Miners today are mining Bitcoin using ASIC chip dedicated to only mining Bitcoin, and the hash rate has shot up to peta hashes.\r\n\r\nBeing the first successful online cryptography currency, Bitcoin has inspired other alternative currencies such as <a href="https://www.coingecko.com/en/coins/litecoin">Litecoin</a>, <a href="https://www.coingecko.com/en/coins/peercoin">Peercoin</a>, <a href="https://www.coingecko.com/en/coins/primecoin">Primecoin</a>, and so on.\r\n\r\nThe cryptocurrency then took off with the innovation of the turing-complete smart contract by <a href="https://www.coingecko.com/en/coins/ethereum">Ethereum</a> which led to the development of other amazing projects such as <a href="https://www.coingecko.com/en/coins/eos">EOS</a>, <a href="https://www.coingecko.com/en/coins/tron">Tron</a>, and even crypto-collectibles such as <a href="https://www.coingecko.com/buzz/ethereum-still-king-dapps-cryptokitties-need-1-billion-on-eos">CryptoKitties</a>.',
          },
        },
        ratios: [
          0.0691218639386313, 0.06898961052131308, 0.06907563148238016,
          0.06948546821608768, 0.0696908218470489, 0.06964412152742994,
          0.06987980906684964,
        ],
        times: [
          "01-28",
          "01-29",
          "01-30",
          "01-31",
          "02-01",
          "02-02",
          "02-03",
          "02-04",
          "02-05",
          "02-06",
          "02-07",
          "02-08",
          "02-09",
          "02-10",
          "02-11",
          "02-12",
          "02-13",
          "02-14",
          "02-15",
          "02-16",
          "02-17",
          "02-18",
          "02-19",
          "02-20",
          "02-21",
          "02-22",
          "02-23",
          "02-24",
          "02-25",
          "02-26",
          "02-27",
        ],
        base_coin_suggestions: null,
        target_coin_suggestions: null,
        from: "January 28, 2023",
        to: "February 27, 2023",
      },
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(compareTokensResponse)

    const output = await composeTokenComparisonEmbed(
      guildId,
      userId,
      baseQ,
      targQ
    )
    const expected = composeEmbedMessage(null, {
      color: getChartColorConfig().borderColor as HexColorString,
      author: [`Ethereum vs. Bitcoin`],
      footer: ["Data fetched from CoinGecko.com"],
      image: "attachment://chart.png",
      description: `**Ratio**: \`0.06987980906684964\``,
      timestamp: (output as RunResult<MessageOptions>)?.messageOptions
        ?.embeds?.[0].timestamp as Date,
    }).addFields([
      {
        name: "Ethereum",
        value: `Rank: \`#2\``
          .concat(`\nPrice: \`$1,637.74\``)
          .concat(`\nMarket cap: \`$197,311,531,168\``),
        inline: true,
      },
      {
        name: "Bitcoin",
        value: `Rank: \`#1\``
          .concat(`\nPrice: \`$23,396\``)
          .concat(`\nMarket cap: \`$451,502,127,078\``),
        inline: true,
      },
    ])
    expect(CacheManager.get).toHaveBeenCalled()
    expect(expected).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
    )
  })

  test("token not supported", async () => {
    const guildId = Discord.SnowflakeUtil.generate()
    const userId = Discord.SnowflakeUtil.generate()
    const baseQ = "btc123"
    const targQ = "eth"
    const compareTokensResponse = {
      ok: false,
      data: null,
    }
    CacheManager.get = jest.fn().mockResolvedValueOnce(compareTokensResponse)
    await expect(
      composeTokenComparisonEmbed(guildId, userId, baseQ, targQ)
    ).rejects.toThrow(InternalError)
  })
})
