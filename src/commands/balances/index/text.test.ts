import { commands } from "commands"
import Discord, { MessageOptions } from "discord.js"
import { APIError } from "errors"
import { RunResult } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { APPROX } from "utils/constants"
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
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `<a:animated_pointing_right:1093923073557807175> You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n<a:animated_pointing_right:1093923073557807175> All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.\n\n<:cake:972205674371117126> \`10 CAKE ${APPROX} $30\`\n<:ftm:967285237686108212> \`5 FTM   ${APPROX} $2.5\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$32.5\``,
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    ).toStrictEqual(expected.author)
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
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `<a:animated_pointing_right:1093923073557807175> You can withdraw the coin to you crypto wallet by \`$withdraw\`.\n<a:animated_pointing_right:1093923073557807175> All the tip transaction will take from this balance. You can try \`$tip <recipient> <amount> <token>\` to transfer coin.\n\n<:cake:972205674371117126> \`10 CAKE ${APPROX} $30\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$30\``,
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    ).toStrictEqual(expected.author)
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
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true
      )} You have nothing yet, use ${await getSlashCommand(
        "earn"
      )} or ${await getSlashCommand("deposit")}`,
    })
    const output = await command.run(msg)
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    ).toStrictEqual(expected.author)
    expect(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    ).toStrictEqual(expected.description)
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
