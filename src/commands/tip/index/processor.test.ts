import { Message } from "discord.js"
import { InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { UnsupportedTokenError } from "errors/unsupported-token"
import { TokenEmojiKey } from "utils/common"
import { convertString } from "utils/convert"
import * as tipbot from "utils/tip-bot"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("adapters/mochi-pay")
jest.mock("utils/profile")
jest.mock("utils/tip-bot")

describe("parseTipArgs", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("Negative - no targets found", async () => {
    const args: string[] = ["tip", "<@>", "1", "ftm", "test message"]
    const getTargetsRes = {
      valid: false,
      targets: [],
      lastIdx: -1,
      firstIdx: -1,
    }
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    await expect(processor.parseTipArgs(msg, args)).rejects.toThrow(
      new InternalError({
        title: "Incorrect recipients",
        description:
          "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
        msgOrInteraction: msg,
      })
    )
  })

  test("Negative - no token or moniker found", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "a",
      "coffee",
      "test message",
    ]
    const getTargetsRes = {
      valid: true,
      targets: ["<@333116155826929671>"],
      lastIdx: 1,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = false
    const parseMonikerRes = undefined

    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMoniker").mockResolvedValueOnce(parseMonikerRes)
    await expect(processor.parseTipArgs(msg, args)).rejects.toThrow(
      new UnsupportedTokenError({ msgOrInteraction: msg, symbol: "COFFEE" })
    )
  })

  test("Positive - Token found", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "1",
      "ftm",
      "test message",
    ]
    const getTargetsRes = {
      valid: true,
      targets: ["<@333116155826929671>"],
      lastIdx: 1,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = true
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMessageTip").mockReturnValueOnce("test message")

    const expected = {
      targets: getTargetsRes.targets,
      amount: 1,
      symbol: "FTM",
      each: false,
      message: "test message",
      all: false,
      image: "",
    }
    const output = await processor.parseTipArgs(msg, args)
    expect(tipbot.parseMoniker).toBeCalledTimes(0)
    expect(output).toStrictEqual(expected)
  })

  test("Positive - Moniker found", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "a",
      "coffee",
      "test message",
    ]
    const getTargetsRes = {
      valid: true,
      targets: ["<@333116155826929671>"],
      lastIdx: 1,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = false
    const parseMonikerRes = {
      moniker: {
        amount: 0.4,
        moniker: "coffee",
        plural: "coffee",
      },
      value: 1,
    }
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMoniker").mockResolvedValueOnce(parseMonikerRes)
    jest.spyOn(tipbot, "parseMessageTip").mockReturnValueOnce("test message")

    const expected = {
      targets: getTargetsRes.targets,
      amount: 0.4,
      symbol: "COFFEE",
      each: false,
      message: "test message",
      all: false,
      image: "",
    }
    const output = await processor.parseTipArgs(msg, args)
    expect(output).toStrictEqual(expected)
  })

  test("Positive - moniker found & with each", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "a",
      "coffee",
      "test message",
      "each",
    ]
    const getTargetsRes = {
      valid: true,
      targets: ["<@333116155826929671>, <@333116155826929672>"],
      lastIdx: 2,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = false
    const parseMonikerRes = {
      moniker: {
        amount: 0.4,
        moniker: "coffee",
        plural: "coffee",
      },
      value: 1,
    }
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMoniker").mockResolvedValueOnce(parseMonikerRes)
    jest.spyOn(tipbot, "parseMessageTip").mockReturnValueOnce("test message")

    const expected = {
      targets: getTargetsRes.targets,
      amount: 0.4,
      symbol: "COFFEE",
      each: false,
      message: "test message",
      all: false,
      image: "",
    }
    const output = await processor.parseTipArgs(msg, args)
    expect(output).toStrictEqual(expected)
  })
})

describe("tip", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("Negative - Insufficient balance", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "1",
      "FTM",
      "test message",
      "each",
    ]
    const targets = ["<@333116155826929671>, <@333116155826929672>"]
    const getTargetsRes = {
      valid: true,
      targets: targets,
      lastIdx: 2,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const parseTipArgsRes = {
      targets,
      amount: 1,
      symbol: "FTM",
      each: true,
      message: "test message",
      all: false,
      image: "",
    }
    const getBalRes = [] as any
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest.spyOn(processor, "parseTipArgs").mockResolvedValueOnce(parseTipArgsRes)
    jest.spyOn(tipbot, "getBalances").mockResolvedValueOnce(getBalRes)

    await expect(processor.tip(msg, args)).rejects.toThrow(
      new InsufficientBalanceError({
        msgOrInteraction: msg,
        params: {
          current: 0,
          required: parseTipArgsRes.amount,
          symbol: parseTipArgsRes.symbol as TokenEmojiKey,
        },
      })
    )
  })

  test("Negative - Invalid recipients", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "1",
      "FTM",
      "test message",
      "each",
    ]
    const targets = ["<@333116155826929671>, <@333116155826929672>"]
    const getTargetsRes = {
      valid: true,
      targets: targets,
      lastIdx: 2,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const parseTipArgsRes = {
      targets,
      amount: 1,
      symbol: "FTM",
      each: true,
      message: "test message",
      all: false,
      image: "",
    }
    const getBalRes = [] as any
    const parseRecipientsRes: string[] = []
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest.spyOn(processor, "parseTipArgs").mockResolvedValueOnce(parseTipArgsRes)
    jest.spyOn(tipbot, "getBalances").mockResolvedValueOnce(getBalRes)
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(processor.tip(msg, args)).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        error: "No valid recipients found",
        message: msg,
      })
    )
  })

  test("Negative - One matching token - Insufficient Balances", async () => {
    const args: string[] = [
      "tip",
      "<@333116155826929671>",
      "<@333116155826929672>",
      "1",
      "FTM",
      "test message",
      "each",
    ]
    const targets = ["<@333116155826929671>, <@333116155826929672>"]
    const getTargetsRes = {
      valid: true,
      targets: targets,
      lastIdx: 2,
      firstIdx: 1,
    }
    const parseTipAmountRes = {
      all: false,
      amount: 1,
    }
    const parseTipArgsRes = {
      targets,
      amount: 1,
      symbol: "FTM",
      each: true,
      message: "test message",
      all: false,
      image: "",
    }
    const getBalRes = [
      {
        token: {
          decimal: 18,
          price: 0.7,
          chain: {
            chain_id: "0x00",
          },
        },
        amount: "0.5",
      },
    ]
    const parseRecipientsRes: string[] = []
    jest.spyOn(tipbot, "getTargets").mockReturnValueOnce(getTargetsRes)
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(parseTipAmountRes)
    jest.spyOn(tipbot, "isTokenSupported").mockResolvedValueOnce(true)
    jest.spyOn(tipbot, "getBalances").mockResolvedValueOnce(getBalRes)
    jest
      .spyOn(tipbot, "parseRecipients")
      .mockResolvedValueOnce(parseRecipientsRes)

    await expect(processor.tip(msg, args)).rejects.toThrow(
      new InsufficientBalanceError({
        msgOrInteraction: msg,
        params: {
          current:
            convertString(getBalRes[0]?.amount, getBalRes[0].token.decimal) ??
            0,
          required: parseTipArgsRes.amount,
          symbol: parseTipArgsRes.symbol as TokenEmojiKey,
        },
      })
    )
  })
})
