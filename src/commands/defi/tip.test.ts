import Discord, { MessageOptions } from "discord.js"
import { mockClient } from "../../../tests/mocks"
import { commands } from "commands"
import { composeEmbedMessage } from "utils/discordEmbed"
import { RunResult } from "types/common"
import defi from "adapters/defi"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import { OffchainTipBotTransferRequest } from "types/defi"
import { APIError } from "errors"

jest.mock("adapters/defi")
const commandKey = "tip"

describe("tip", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  if (!commands[commandKey]) return
  const command = commands[commandKey]

  test("tip user successfully", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@!760874365037314100> 1.5 cake",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 1.5,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 1.5,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100> **1.5 CAKE** (\u2248 $1.5) `,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip users successfully", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@!760874365037314100> <@!580788681967665173> 2 cake",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 2,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 1,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 1,
          amount_in_usd: 1.5,
          recipient_id: "580788681967665173",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100>,<@!580788681967665173> **1 CAKE** (\u2248 $1.5) each`,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip user all", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@!760874365037314100> all cake",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 0,
      token: "CAKE",
      each: false,
      all: true,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 10,
          amount_in_usd: 20.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100> **10 CAKE** (\u2248 $20.5) `,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip users each", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content:
          "$tip <@!760874365037314100> <@!580788681967665173> 1.5 cake each",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 3,
      token: "CAKE",
      each: true,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 1.5,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 1.5,
          amount_in_usd: 1.5,
          recipient_id: "580788681967665173",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100>,<@!580788681967665173> **1.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip role succesfully", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@&1039124250004574208> 3 cake",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 3,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 1.5,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 1.5,
          amount_in_usd: 1.5,
          recipient_id: "580788681967665173",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const params = {
      each: false,
      targets: ["<@&1039124250004574208>"],
      cryptocurrency: "CAKE",
      amountArg: 3,
    }
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **2 users** in <@&1039124250004574208> **1.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip role each", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content:
          "$tip <@&1039124250004574208> <@&1041914485251788800> 0.5 cake each",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "760874365037314100",
        "580788681967665173",
        "753995829559165044",
        "205167514731151360",
      ],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 2,
      token: "CAKE",
      each: true,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "580788681967665173",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "753995829559165044",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "205167514731151360",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const params = {
      each: true,
      targets: ["<@&1039124250004574208>", "<@&1041914485251788800>"],
      cryptocurrency: "CAKE",
      amountArg: 0.5,
    }
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **4 users** in <@&1039124250004574208>,<@&1041914485251788800> **0.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("tip text channel", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <#984660970624409630> 0.5 cake each",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "760874365037314100",
        "580788681967665173",
        "753995829559165044",
        "205167514731151360",
      ],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 2,
      token: "CAKE",
      each: true,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      ok: true,
      data: [
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "760874365037314100",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "580788681967665173",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "753995829559165044",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 0.5,
          amount_in_usd: 1.5,
          recipient_id: "205167514731151360",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const params = {
      each: true,
      targets: ["<#984660970624409630>"],
      cryptocurrency: "CAKE",
      amountArg: 0.5,
    }
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **4 users** in <#984660970624409630> **0.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = await command.run(msg)
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
    expect(expected.thumbnail).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .thumbnail
    )
    expect(expected.author).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].author
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("insufficient balance", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@!760874365037314100> 5 cake",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 5,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      error: "Not enough balance",
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
      expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })

  test("token not supported", async () => {
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$tip <@!760874365037314100> 1.5 alt",
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
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100"],
      guildId: msg.guild_id,
      channelId: msg.channel_id,
      amount: 5,
      token: "ALT",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const transferResp = {
      error: "Token not supported",
    }
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
      expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
