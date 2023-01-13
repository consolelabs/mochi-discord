import Discord, { MessageEmbed, MessageOptions } from "discord.js"
import { commands } from "commands"
import { composeEmbedMessage } from "ui/discord/embed"
import { RunResult } from "types/common"
import defi from "adapters/defi"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import { OffchainTipBotTransferRequest } from "types/defi"
import { APIError } from "errors"
import { mockClient } from "../../../../tests/mocks"

jest.mock("adapters/defi")
const commandKey = "tip"

describe("tip", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  if (!commands[commandKey]) return
  const command = commands[commandKey]

  function makeTipMessage(content: string) {
    return Reflect.construct(Discord.Message, [
      mockClient,
      {
        content,
        author: {
          id: userId,
          username: "doesnt matter",
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
  }

  function assertThumbnail(
    output: RunResult<MessageOptions>,
    expected: MessageEmbed
  ) {
    expect(output?.messageOptions?.embeds?.[0].thumbnail).toStrictEqual(
      expected.thumbnail
    )
  }
  function assertAuthor(
    output: RunResult<MessageOptions>,
    expected: MessageEmbed
  ) {
    expect(output?.messageOptions?.embeds?.[0].author).toStrictEqual(
      expected.author
    )
  }
  function assertDescription(
    output: RunResult<MessageOptions>,
    expected: MessageEmbed
  ) {
    expect(output?.messageOptions?.embeds?.[0].description).toStrictEqual(
      expected.description
    )
  }

  test("tip user successfully", async () => {
    const msg = makeTipMessage("$tip <@!760874365037314100> 1.5 cake")
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
    const syntaxTargets = {
      targets: ["<@!760874365037314100>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@!760874365037314100>", "1.5", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@!760874365037314100>", "1.5", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "1.5",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100> **1.5 CAKE** (\u2248 $1.5) `,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>

    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip users successfully", async () => {
    const msg = makeTipMessage(
      "$tip <@!760874365037314100> <@!580788681967665173> 2 cake"
    )
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
    const syntaxTargets = {
      targets: ["<@!760874365037314100>", "<@!580788681967665173>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@!760874365037314100>",
        "<@!580788681967665173>",
        "2",
        "cake",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@!760874365037314100>",
        "<@!580788681967665173>",
        "2",
        "cake",
      ],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "2",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100>, <@!580788681967665173> **1 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip user all", async () => {
    const msg = makeTipMessage("$tip <@!760874365037314100> all cake")
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
    const syntaxTargets = {
      targets: ["<@!760874365037314100>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@!760874365037314100>", "all", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@!760874365037314100>", "all", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "all",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100> **10 CAKE** (\u2248 $20.5) `,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip users each", async () => {
    const msg = makeTipMessage(
      "$tip <@!760874365037314100> <@!580788681967665173> 1.5 cake each"
    )
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
    const syntaxTargets = {
      targets: ["<@!760874365037314100>", "<@!580788681967665173>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@!760874365037314100>",
        "<@!580788681967665173>",
        "1.5",
        "cake",
        "each",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@!760874365037314100>",
        "<@!580788681967665173>",
        "1.5",
        "cake",
        "each",
      ],
      messageTip: "",
    }
    const parseTip = {
      each: true,
      cryptocurrency: "cake",
      amountArg: "1.5",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent <@!760874365037314100>, <@!580788681967665173> **1.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip role succesfully", async () => {
    const msg = makeTipMessage("$tip <@&1039124250004574208> 3 cake")
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
    const syntaxTargets = {
      targets: ["<@&1039124250004574208>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@&1039124250004574208>", "3", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@&1039124250004574208>", "3", "cake"],
      messageTip: "",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **2 user(s) (<@!760874365037314100>, <@!580788681967665173>)** in <@&1039124250004574208> **1.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip role each", async () => {
    const msg = makeTipMessage(
      "$tip <@&1039124250004574208> <@&1041914485251788800> 0.5 cake each"
    )
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
    const syntaxTargets = {
      targets: ["<@&1039124250004574208>", "<@&1041914485251788800>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@&1039124250004574208>",
        "<@&1041914485251788800>",
        "0.5",
        "cake",
        "each",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@&1039124250004574208>",
        "<@&1041914485251788800>",
        "0.5",
        "cake",
        "each",
      ],
      messageTip: "",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **4 user(s) (<@!760874365037314100>, <@!580788681967665173>, <@!753995829559165044>, <@!205167514731151360>)** in <@&1039124250004574208>, <@&1041914485251788800> **0.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip text channel", async () => {
    const msg = makeTipMessage("$tip <#984660970624409630> 0.5 cake each")
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
    const syntaxTargets = {
      targets: ["<#984660970624409630>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<#984660970624409630>", "0.5", "cake", "each"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<#984660970624409630>", "0.5", "cake", "each"],
      messageTip: "",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **4 user(s) (<@!760874365037314100>, <@!580788681967665173>, <@!753995829559165044>, <@!205167514731151360>)** in <#984660970624409630> **0.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("tip online status", async () => {
    const msg = makeTipMessage("$tip online 0.5 cake each")
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
    const syntaxTargets = {
      targets: ["online"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "online", "0.5", "cake", "each"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "online", "0.5", "cake", "each"],
      messageTip: "",
    }
    const parseTip = {
      each: true,
      cryptocurrency: "cake",
      amountArg: "0.5",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.parseTipParameters = jest.fn().mockReturnValue(params)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@!${userId}> has sent **4 online user(s) (<@!760874365037314100>, <@!580788681967665173>, <@!753995829559165044>, <@!205167514731151360>)** **0.5 CAKE** (\u2248 $1.5) each`,
    })
    const output = (await command.run(msg)) as RunResult<MessageOptions>
    expect(defi.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)

    assertThumbnail(output, expected)
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("insufficient balance", async () => {
    const msg = makeTipMessage("$tip <@!760874365037314100> 10 cake")
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
    const syntaxTargets = {
      targets: ["<@!760874365037314100>"],
      isValid: true,
    }
    const transferResp = {
      error: "Not enough balance",
    }
    const moniker = {
      newArgs: ["tip", "<@!760874365037314100>", "10", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@!760874365037314100>", "10", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "10",
    }
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(true)
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.getTipPayload = jest.fn().mockResolvedValueOnce(tipPayload)
    defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)

    try {
      await command.run(msg)
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
    }
  })

  test("token not supported", async () => {
    const msg = makeTipMessage("$tip <@!760874365037314100> 1.5 alt")
    const syntaxTargets = {
      targets: ["<@!760874365037314100>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@!760874365037314100>", "1.5", "alt"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@!760874365037314100>", "1.5", "alt"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "alt",
      amountArg: "1.5",
    }
    defi.parseMessageTip = jest.fn().mockResolvedValueOnce(msgTip)
    defi.parseMonikerinCmd = jest.fn().mockResolvedValueOnce(moniker)
    defi.parseTipParameters = jest.fn().mockResolvedValueOnce(parseTip)
    defi.classifyTipSyntaxTargets = jest.fn().mockReturnValueOnce(syntaxTargets)
    defi.tipTokenIsSupported = jest.fn().mockResolvedValueOnce(false)
    try {
      await command.run(msg)
    } catch (e) {
      expect(e).toBeInstanceOf(TypeError)
    }
  })
})
