import { commands } from "commands"
import Discord, { MessageOptions } from "discord.js"
import { APIError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { mockClient } from "../../../../tests/mocks"
import mochiPay from "../../../adapters/mochi-pay"

jest.mock("adapters/defi")
const commandKey = "balances"

describe("balances", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  if (!commands[commandKey]) return
  const command = commands[commandKey]

  test("balances", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$balances",
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
    const balResp = {
      ok: true,
      data: [
        {
          amount: 10000000000000000000,
          token: {
            name: "Panswap Cake",
            symbol: "CAKE",
            decimal: 18,
            price: 3,
          },
        },
        {
          amount: 5000000000000000000,
          token: {
            name: "Fantom",
            decimal: 18,
            symbol: "FTM",
            price: 0.5,
          },
        },
      ],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Offchain balance", getEmojiURL(emojis.WALLET)],
    })
      .addFields({
        name: "Panswap Cake",
        value:
          "<:cake:972205674371117126> 10 CAKE `$30` <:blank:967287119448014868>",
        inline: true,
      })
      .addFields({
        name: "Fantom",
        value:
          "<:ftm:967285237686108212> 5 FTM `$2.5` <:blank:967287119448014868>",
        inline: true,
      })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Estimated total (U.S dollar)`,
      value: "<:cash:933341119998210058> `$32.5`",
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.fields).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
    )
  })

  test("bal", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$bal",
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
    const balResp = {
      ok: true,
      data: [
        {
          amount: 10000000000000000000,
          token: {
            name: "Panswap Cake",
            symbol: "CAKE",
            decimal: 18,
            price: 3,
          },
        },
      ],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Offchain balance", getEmojiURL(emojis.WALLET)],
    }).addFields({
      name: "Panswap Cake",
      value:
        "<:cake:972205674371117126> 10 CAKE `$30` <:blank:967287119448014868>",
      inline: true,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Estimated total (U.S dollar)`,
      value: "<:cash:933341119998210058> `$30`",
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.fields).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].fields
    )
  })

  test("dont have balances", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$balances",
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
    const balResp = {
      ok: true,
      data: [],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    const expected = composeEmbedMessage(null, {
      author: ["Offchain balance", getEmojiURL(emojis.WALLET)],
      description: "No balance. Try `$deposit` more into your wallet.",
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("balances api error", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$bals",
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
    const balResp = {
      error: "error",
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await command.run(msg)
    } catch (e) {
      expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
