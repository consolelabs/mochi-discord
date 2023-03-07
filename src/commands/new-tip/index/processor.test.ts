import { userMention } from "@discordjs/builders"
import defi from "adapters/defi"
import { Message, MessageOptions, SnowflakeUtil } from "discord.js"
import { APIError, InternalError } from "errors"
import { RunResult } from "types/common"
import { OffchainTipBotTransferRequest } from "types/defi"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmojiURL, msgColors, thumbnails } from "utils/common"
import * as tiputils from "utils/tip-bot"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("utils/tip-bot")

describe("parseMessageTip", () => {
  test("parse text", async () => {
    const args = ["tip", "@user", "1", "ftm", "test message"]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse text in quotes", async () => {
    const args = ["tip", "@user", "1", "ftm", `"test message"`]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse text in single quotes", async () => {
    const args = ["tip", "@user", "1", "ftm", `'test message'`]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse no message", async () => {
    const args = ["tip", "@user", "1", "ftm"] // no message to changes to args
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
  test("parse invalid token", async () => {
    const args = ["tip", "@user", "1", "cake"] // does not consider token valid
    const expected = {
      newArgs: ["tip", "@user", "1", "cake"],
      messageTip: "",
    }
    const allTokenRes = {
      ok: true,
      data: [{ token_symbol: "ftm" }],
      log: "",
      curl: "",
    }

    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(args)
    expect(output).toEqual(expected)
  })
})

// parseTipParameters - only used for minimum tip syntax
test.each([
  [
    ["tip", "@user", "1", "ftm"],
    { amountArg: "1", cryptocurrency: "FTM", each: false },
  ],
  // tip multiple
  [
    ["tip", "@user1", "@user2", "2", "ftm"],
    { amountArg: "2", cryptocurrency: "FTM", each: false },
  ],
  // tip multiple each
  [
    ["tip", "@user", "@user2", "1", "ftm", "each"],
    { amountArg: "1", cryptocurrency: "FTM", each: true },
  ],
  [
    ["tip", "@user", "1", "ftm", "message"],
    { amountArg: "ftm", cryptocurrency: "MESSAGE", each: false }, // expected failure
  ],
])("defi.parseTipParameters(%o)", (input, output) => {
  expect(processor.parseTipParameters(input)).toStrictEqual(output)
})

// executeTip
describe("executeTip", () => {
  const msg = mockdc.cloneMessage()
  const userId = SnowflakeUtil.generate()
  test("tip user", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041344"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = ["<@521591222826041344>"]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent ${targets[0]} **100 CAKE** (\u2248 $100) `,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip online", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "521591222826041344",
        "521591222826041343",
        "521591222826041342",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041343",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041342",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "online",
      "<@521591222826041344>",
      "<@521591222826041343>",
      "<@521591222826041342>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **3 online user(s) (${targets[1]}, ${targets[2]}, ${targets[3]})** **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip online > 10 users", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "521591222826041349",
        "521591222826041348",
        "521591222826041347",
        "521591222826041346",
        "521591222826041345",
        "521591222826041344",
        "521591222826041343",
        "521591222826041342",
        "521591222826041341",
        "521591222826041340",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041349",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041348",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041347",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041346",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041345",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041343",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041342",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041341",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041340",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "online",
      "<@521591222826041349>",
      "<@521591222826041348>",
      "<@521591222826041347>",
      "<@521591222826041346>",
      "<@521591222826041345>",
      "<@521591222826041344>",
      "<@521591222826041343>",
      "<@521591222826041342>",
      "<@521591222826041341>",
      "<@521591222826041340>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **10 online user(s)** **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip role", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041349", "521591222826041348"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041349",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041348",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "<@&1022071198651269150>",
      "<@521591222826041349>",
      "<@521591222826041348>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **2 user(s) (<@521591222826041349>, <@521591222826041348>)** in <@&1022071198651269150> **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip role > 10 users", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "521591222826041349",
        "521591222826041348",
        "521591222826041347",
        "521591222826041346",
        "521591222826041345",
        "521591222826041344",
        "521591222826041343",
        "521591222826041342",
        "521591222826041341",
        "521591222826041340",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041349",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041348",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041347",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041346",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041345",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041343",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041342",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041341",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041340",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "<@&1022071198651269150>",
      "<@521591222826041349>",
      "<@521591222826041348>",
      "<@521591222826041347>",
      "<@521591222826041346>",
      "<@521591222826041345>",
      "<@521591222826041344>",
      "<@521591222826041343>",
      "<@521591222826041342>",
      "<@521591222826041341>",
      "<@521591222826041340>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **10 user(s)** in <@&1022071198651269150> **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip channel", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041349", "521591222826041348"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041349",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041348",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "<#1035139564504891462>",
      "<@521591222826041349>",
      "<@521591222826041348>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **2 user(s) (<@521591222826041349>, <@521591222826041348>)** in <#1035139564504891462> **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
  test("tip channel > 10 users", async () => {
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "521591222826041349",
        "521591222826041348",
        "521591222826041347",
        "521591222826041346",
        "521591222826041345",
        "521591222826041344",
        "521591222826041343",
        "521591222826041342",
        "521591222826041341",
        "521591222826041340",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
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
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041349",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041348",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041347",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041346",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041345",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041343",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041342",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041341",
          sender_id: userId,
          symbol: "CAKE",
        },
        {
          amount: 100,
          amount_in_usd: 100,
          recipient_id: "521591222826041340",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const targets = [
      "<#1035139564504891462>",
      "<@521591222826041349>",
      "<@521591222826041348>",
      "<@521591222826041347>",
      "<@521591222826041346>",
      "<@521591222826041345>",
      "<@521591222826041344>",
      "<@521591222826041343>",
      "<@521591222826041342>",
      "<@521591222826041341>",
      "<@521591222826041340>",
    ]
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    const output = await processor.executeTip(
      msg,
      tipPayload,
      targets,
      "",
      "",
      false
    )
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `<@${userId}> has sent **10 user(s)** in <#1035139564504891462> **100 CAKE** (\u2248 $100) each`,
      color: msgColors.SUCCESS,
    })

    assertRunResult(output as RunResult<MessageOptions>, {
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
  })
})

//handleTip
describe("handleTip", () => {
  const userId = SnowflakeUtil.generate()
  let msg: Message
  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("insufficient balance", async () => {
    msg.content = "$tip <@760874365037314100> 10 cake"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 5,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const syntaxTargets = {
      targets: ["<@760874365037314100>"],
      isValid: true,
    }
    const transferResp = {
      error: "Not enough balance",
    }
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 5,
          balances_in_usd: 5,
          rate_in_usd: 1,
        },
      ],
    }
    const moniker = {
      newArgs: ["tip", "<@760874365037314100>", "10", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@760874365037314100>", "10", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "10",
    }
    // defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await expect(processor.tip(msg, args)).rejects.toThrow(APIError)
  })

  test("token not supported", async () => {
    msg.content = "$tip <@760874365037314100> 1.5 alt"
    const args = getCommandArguments(msg)
    const syntaxTargets = {
      targets: ["<@760874365037314100>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@760874365037314100>", "1.5", "alt"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@760874365037314100>", "1.5", "alt"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "alt",
      amountArg: "1.5",
    }
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(false)
    await expect(processor.tip(msg, args)).rejects.toThrow(InternalError)
  })

  test("tip user successfully", async () => {
    const recipient = userMention("521591222826041344")
    msg.content = `$tip ${recipient} 1.5 cake`
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041344"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 10,
          rate_in_usd: 1,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@521591222826041344>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@521591222826041344>", "1.5", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@521591222826041344>", "1.5", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "1.5",
    }

    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip user with confirmation", async () => {
    const recipient = userMention("521591222826041344")
    msg.content = `$tip ${recipient} 100 cake`
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041344"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 200,
          balances_in_usd: 200,
          rate_in_usd: 1,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@521591222826041344>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@521591222826041344>", "100", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@521591222826041344>", "100", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "100",
    }

    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
  })

  test("tip users successfully", async () => {
    msg.content = "$tip <@760874365037314100> <@580788681967665173> 2 cake"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 15,
          rate_in_usd: 1.5,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@760874365037314100>", "<@580788681967665173>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
        "2",
        "cake",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip users with confirmation", async () => {
    msg.content = `$tip <@760874365037314100> <@580788681967665173> 100 cake`
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
      amount: 100,
      token: "CAKE",
      each: false,
      all: false,
      transferType: "tip",
      duration: 0,
      fullCommand: "",
    }
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 200,
          balances_in_usd: 200,
          rate_in_usd: 1,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@760874365037314100>", "<@580788681967665173>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
        "100",
        "cake",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
        "100",
        "cake",
      ],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "100",
    }

    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
  })

  test("tip user all", async () => {
    msg.content = "$tip <@760874365037314100> all cake"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["521591222826041344"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
          recipient_id: "521591222826041344",
          sender_id: userId,
          symbol: "CAKE",
        },
      ],
    }
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 20.5,
          rate_in_usd: 2.05,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@521591222826041344>"],
      isValid: true,
    }
    const moniker = {
      newArgs: ["tip", "<@521591222826041344>", "all", "cake"],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: ["tip", "<@521591222826041344>", "all", "cake"],
      messageTip: "",
    }
    const parseTip = {
      each: false,
      cryptocurrency: "cake",
      amountArg: "all",
    }
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip users each", async () => {
    msg.content =
      "$tip <@760874365037314100> <@580788681967665173> 1.5 cake each"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 15,
          rate_in_usd: 1.5,
        },
      ],
    }
    const syntaxTargets = {
      targets: ["<@760874365037314100>", "<@580788681967665173>"],
      isValid: true,
    }
    const moniker = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
        "1.5",
        "cake",
        "each",
      ],
      moniker: undefined,
    }
    const msgTip = {
      newArgs: [
        "tip",
        "<@760874365037314100>",
        "<@580788681967665173>",
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip role succesfully", async () => {
    msg.content = "$tip <@&1039124250004574208> 3 cake"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: ["760874365037314100", "580788681967665173"],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 15,
          rate_in_usd: 1.5,
        },
      ],
    }
    const parseTip = {
      each: false,
      cryptocurrency: "CAKE",
      amountArg: "3",
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)

    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip role each", async () => {
    msg.content =
      "$tip <@&1039124250004574208> <@&1041914485251788800> 0.5 cake each"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "760874365037314100",
        "580788681967665173",
        "753995829559165044",
        "205167514731151360",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 30,
          rate_in_usd: 3,
        },
      ],
    }
    const parseTip = {
      each: true,
      cryptocurrency: "CAKE",
      amountArg: "0.5",
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip text channel", async () => {
    msg.content = "$tip <#984660970624409630> 0.5 cake each"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "760874365037314100",
        "580788681967665173",
        "753995829559165044",
        "205167514731151360",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 30,
          rate_in_usd: 3,
        },
      ],
    }
    const parseTip = {
      each: true,
      cryptocurrency: "CAKE",
      amountArg: "0.5",
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })

  test("tip online status", async () => {
    msg.content = "$tip online 0.5 cake each"
    const args = getCommandArguments(msg)
    const tipPayload: OffchainTipBotTransferRequest = {
      sender: userId,
      recipients: [
        "760874365037314100",
        "580788681967665173",
        "753995829559165044",
        "205167514731151360",
      ],
      guildId: msg.guildId ?? "",
      channelId: msg.channelId,
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
    const checkBalResp = {
      ok: true,
      data: [
        {
          id: "pancake-swap",
          name: "Pancake",
          symbol: "CAKE",
          balances: 10,
          balances_in_usd: 30,
          rate_in_usd: 3,
        },
      ],
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
    jest.spyOn(tiputils, "parseMonikerinCmd").mockResolvedValueOnce(moniker)
    jest.spyOn(processor, "parseMessageTip").mockResolvedValueOnce(msgTip)
    jest.spyOn(processor, "parseTipParameters").mockReturnValueOnce(parseTip)
    jest
      .spyOn(tiputils, "classifyTipSyntaxTargets")
      .mockReturnValueOnce(syntaxTargets)
    jest.spyOn(processor, "getTipPayload").mockResolvedValueOnce(tipPayload)
    defi.offchainGetUserBalances = jest.fn().mockResolvedValueOnce(checkBalResp)
    defi.offchainDiscordTransfer = jest.fn().mockResolvedValueOnce(transferResp)
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    await processor.tip(msg, args)
    expect(processor.getTipPayload).toHaveBeenCalledTimes(1)
    expect(defi.offchainDiscordTransfer).toHaveBeenCalledTimes(1)
  })
})
