import { userMention } from "@discordjs/builders"
import mochiPay from "adapters/mochi-pay"
import { Message } from "discord.js"
import { APIError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  emojis,
  getEmojiURL,
  msgColors,
  roundFloatNumber,
  thumbnails,
  TokenEmojiKey,
} from "utils/common"
import * as defiUtils from "utils/defi"
import * as profile from "utils/profile"
import * as tipbot from "utils/tip-bot"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("adapters/mochi-pay")
jest.mock("utils/profile")
jest.mock("utils/tip-bot")

type ParseTipParamRes = {
  amountArg: string
  cryptocurrency: TokenEmojiKey
  each: boolean
}

describe("parseMessageTip", () => {
  test("parse text", async () => {
    const argsAfterParseMoniker: string[] = [
      "tip",
      "@user",
      "1",
      "ftm",
      "test message",
    ]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ symbol: "ftm" }],
      log: "",
      curl: "",
    }
    mochiPay.getTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(argsAfterParseMoniker)
    expect(output).toEqual(expected)
  })

  test("parse message in single quote", async () => {
    const argsAfterParseMoniker: string[] = [
      "tip",
      "@user",
      "1",
      "ftm",
      "'test message'",
    ]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ symbol: "ftm" }],
      log: "",
      curl: "",
    }
    mochiPay.getTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(argsAfterParseMoniker)
    expect(output).toEqual(expected)
  })

  test("parse message in double quote", async () => {
    const argsAfterParseMoniker: string[] = [
      "tip",
      "@user",
      "1",
      "ftm",
      `"test message"`,
    ]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "test message",
    }
    const allTokenRes = {
      ok: true,
      data: [{ symbol: "ftm" }],
      log: "",
      curl: "",
    }
    mochiPay.getTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(argsAfterParseMoniker)
    expect(output).toEqual(expected)
  })

  test("no message -> no changes in args", async () => {
    const argsAfterParseMoniker: string[] = ["tip", "@user", "1", "ftm"]
    const expected = {
      newArgs: ["tip", "@user", "1", "ftm"],
      messageTip: "",
    }
    const allTokenRes = {
      ok: true,
      data: [{ symbol: "ftm" }],
      log: "",
      curl: "",
    }
    mochiPay.getTokens = jest.fn().mockResolvedValueOnce(allTokenRes)
    const output = await processor.parseMessageTip(argsAfterParseMoniker)
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
])("defi.parseTipParameters(%o) - positive cases", (input, output) => {
  expect(processor.parseTipParameters(input)).toStrictEqual(output)
})

describe("getTipPayload - positive cases", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("with moniker", async () => {
    const argsAfterParseMessage = ["tip", "@user", "a", "ftm"]
    const targets = ["<@333116155826929671>"]
    const moniker = {
      moniker: {
        amount: 0.4,
        moniker: "coffee",
        plural: "coffee",
        token: { token_symbol: "ftm" },
      },
    }
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222"]
    const parseRecipientsRes: string[] = ["333116155826929671"]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 0.4

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })

  test("no moniker", async () => {
    const argsAfterParseMessage = ["tip", "@user", "1.5", "ftm"]
    const targets = ["<@333116155826929671>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222"]
    const parseRecipientsRes: string[] = ["333116155826929671"]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 1.5

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })

  test("with each, no moniker", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "0.5",
      "ftm",
      "each",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "0.5",
      cryptocurrency: "FTM",
      each: true,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 1

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })

  test("with each, with moniker", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "a",
      "ftm",
      "each",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = {
      moniker: {
        amount: 0.4,
        moniker: "coffee",
        plural: "coffee",
        token: { token_symbol: "ftm" },
      },
    }
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 0.8

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })

  test("with all, no moniker", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "all",
      "ftm",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "all",
      cryptocurrency: "FTM",
      each: true,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 10

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })

  test("with all & each -> each = false", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "all",
      "ftm",
      "each",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "all",
      cryptocurrency: "FTM",
      each: true,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const getTokenRes = {
      id: 1,
    }
    const expectAmount = 10

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)
    jest
      .spyOn(defiUtils, "validateBalance")
      .mockResolvedValueOnce(validateBalanceRes)
    jest.spyOn(tipbot, "getToken").mockResolvedValueOnce(getTokenRes)

    const expectedOutput = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: senderProfileId,
        platform: "discord",
      },
      tos: recipientProfileIDs.map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    const output = await processor.getTipPayload(
      msg,
      argsAfterParseMessage,
      msg.author.id,
      targets,
      moniker
    )
    expect(output).toEqual(expectedOutput)
  })
})

describe("getTipPayload - negative cases", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("negative amount", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "-1",
      "ftm",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "-1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(
      processor.getTipPayload(
        msg,
        argsAfterParseMessage,
        msg.author.id,
        targets,
        moniker
      )
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: senderProfileId,
        message: msg,
        error: "The amount is invalid. Please insert a natural number.",
      })
    )
  })

  test("zero amount", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "0",
      "ftm",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "0",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["222", "333"]
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(
      processor.getTipPayload(
        msg,
        argsAfterParseMessage,
        msg.author.id,
        targets,
        moniker
      )
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: senderProfileId,
        message: msg,
        error: "The amount is invalid. Please insert a natural number.",
      })
    )
  })

  test("recipient's discord ID = author's discord ID, with one more person", async () => {
    const argsAfterParseMessage = ["tip", `<@${msg.author.id}>`, "1", "ftm"]
    const targets = [`<@${msg.author.id}>`]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["111"]
    const parseRecipientsRes: string[] = [
      `${msg.author.id}`,
      "333116155826929672",
    ]

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(
      processor.getTipPayload(
        msg,
        argsAfterParseMessage,
        msg.author.id,
        targets,
        moniker
      )
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "Users cannot tip themselves!",
      })
    )
  })

  test("recipient's discord ID = author's discord ID, with one more person", async () => {
    const argsAfterParseMessage = [
      "tip",
      `<@${msg.author.id}>`,
      "<@333116155826929672>",
      "1",
      "ftm",
    ]
    const targets = [`<@${msg.author.id}>`, "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const recipientProfileIDs = ["111", "333"]
    const parseRecipientsRes: string[] = [
      `${msg.author.id}`,
      "333116155826929672",
    ]

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(recipientProfileIDs[0])
      .mockResolvedValueOnce(recipientProfileIDs[1])
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(
      processor.getTipPayload(
        msg,
        argsAfterParseMessage,
        msg.author.id,
        targets,
        moniker
      )
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "Users cannot tip themselves!",
      })
    )
  })

  test("no valid recipients", async () => {
    const argsAfterParseMessage = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "1",
      "ftm",
    ]
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const moniker = undefined
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "1",
      cryptocurrency: "FTM",
      each: false,
    }
    const senderProfileId = "111"
    const parseRecipientsRes: string[] = [
      "333116155826929671",
      "333116155826929672",
    ]

    jest
      .spyOn(processor, "parseTipParameters")
      .mockReturnValueOnce(parseTipParamsRes)
    jest
      .spyOn(profile, "getProfileIdByDiscord")
      .mockResolvedValueOnce(senderProfileId)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(
      processor.getTipPayload(
        msg,
        argsAfterParseMessage,
        msg.author.id,
        targets,
        moniker
      )
    ).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "No valid recipient was found!",
      })
    )
  })
})

describe("executeTip", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("execute tip success", async () => {
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const expectAmount = 10
    const getTokenRes = {
      id: 1,
    }
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "5",
      cryptocurrency: "FTM",
      each: false,
    }
    const recipientProfileIDs = ["222", "333"]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const payload = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: "111",
        platform: "discord",
      },
      tos: ["222", "333"].map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    mochiPay.transfer = jest.fn().mockResolvedValueOnce({ status: 200 })

    const description = `${userMention(
      payload.sender
    )} has sent ${payload.recipients.join(", ")} **${roundFloatNumber(
      +payload.amount[0],
      4
    )} ${payload.token}** (\u2248 $${roundFloatNumber(
      payload.amount_in_usd * payload.amount[0] ?? 0,
      4
    )}) ${payload.recipients.length > 1 ? "each" : ""}`

    const expectedEmbed = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.CASH)],
      description: description,
      color: msgColors.SUCCESS,
    })

    const output = await processor.executeTip(
      msg,
      payload,
      targets,
      "",
      "",
      false
    )
    assertRunResult(output, {
      messageOptions: { embeds: [expectedEmbed], components: [] },
    })
  })

  test("tip transfer error with status != 200", async () => {
    const targets = ["<@333116155826929671>", "<@333116155826929672>"]
    const expectAmount = 10
    const getTokenRes = {
      id: 1,
    }
    const parseTipParamsRes: ParseTipParamRes = {
      amountArg: "5",
      cryptocurrency: "FTM",
      each: false,
    }
    const recipientProfileIDs = ["222", "333"]
    const validateBalanceRes = {
      balance: 10,
      usdBalance: 100,
    }
    const payload = {
      sender: msg.author.id,
      recipients: targets,
      from: {
        profile_global_id: "111",
        platform: "discord",
      },
      tos: ["222", "333"].map((r) => ({
        profile_global_id: `${r}`,
        platform: "discord",
      })),
      amount: Array(recipientProfileIDs.length).fill(
        `${expectAmount / recipientProfileIDs.length}`
      ),
      originalAmount: expectAmount,
      token: parseTipParamsRes.cryptocurrency,
      token_id: getTokenRes.id,
      amount_in_usd: validateBalanceRes.usdBalance,
      note: "",
    }

    jest.spyOn(mochiPay, "transfer").mockResolvedValueOnce({ status: 500 })

    await expect(
      processor.executeTip(msg, payload, targets, "", "", false)
    ).rejects.toThrow(
      new APIError({
        msgOrInteraction: msg,
        curl: "",
        description: `[transfer] failed with status 500`,
      })
    )
  })
})
