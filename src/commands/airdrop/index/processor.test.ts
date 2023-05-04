import { CommandInteraction } from "discord.js"
import { InternalError } from "errors"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { UnsupportedTokenError } from "errors/unsupported-token"
import * as tipbot from "utils/tip-bot"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("getAirdropArgs", () => {
  let i: CommandInteraction

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))
  afterEach(() => jest.clearAllMocks())

  test("token is not supported & not a configured moniker", async () => {
    const mockTipAmount = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = false
    const parseMonikerRes = undefined
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("COFFEE")
    i.options.getInteger = jest.fn().mockReturnValueOnce(1) // entries
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(mockTipAmount)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMoniker").mockResolvedValueOnce(parseMonikerRes)
    await expect(processor.getAirdropArgs(i)).rejects.toThrow(
      new UnsupportedTokenError({ msgOrInteraction: i, symbol: "COFFEE" })
    )
  })

  test("duration < 5s -> throw error", async () => {
    const mockTipAmount = {
      all: false,
      amount: 1,
    }
    const isTokenSupportedRes = true
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("FTM")
      .mockReturnValueOnce("3s")
    i.options.getInteger = jest.fn().mockReturnValueOnce(1) // entries
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(mockTipAmount)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    await expect(processor.getAirdropArgs(i)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: i,
        title: "Invalid duration",
        description:
          "The duration must be in form of second (s), minute (m) or hours (h) and from 5s to 1h.",
      })
    )
  })

  test("default duration unit set to minute (3 -> 3m = 180s)", async () => {
    const mockTipAmount = {
      all: false,
      amount: 1,
    }
    const mockResult = {
      amount: 1,
      token: "FTM",
      duration: 180,
      entries: 1,
      all: false,
    }
    const isTokenSupportedRes = true
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("FTM")
      .mockReturnValueOnce("3")
    i.options.getInteger = jest.fn().mockReturnValueOnce(1) // entries
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(mockTipAmount)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    const output = await processor.getAirdropArgs(i)
    expect(output).toEqual(mockResult)
  })

  test("max allowed duration = 3600", async () => {
    const mockTipAmount = {
      all: false,
      amount: 1,
    }
    const mockResult = {
      amount: 1,
      token: "FTM",
      duration: 3600,
      entries: 1,
      all: false,
    }
    const isTokenSupportedRes = true
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("FTM")
      .mockReturnValueOnce("1.5h")
    i.options.getInteger = jest.fn().mockReturnValueOnce(1) // entries
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(mockTipAmount)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    const output = await processor.getAirdropArgs(i)
    expect(output).toEqual(mockResult)
  })

  test("moniker found", async () => {
    const mockTipAmount = {
      all: false,
      amount: 1,
    }
    const mockResult = {
      amount: 0.4,
      token: "COFFEE",
      duration: 180,
      entries: 10,
      all: false,
    }
    const parseMonikerRes = {
      moniker: {
        amount: 0.4,
        moniker: "coffee",
        plural: "coffee",
      },
      value: 1,
    }
    const isTokenSupportedRes = false
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("a")
      .mockReturnValueOnce("coffee")
    i.options.getInteger = jest.fn().mockReturnValueOnce(10) // entries
    jest.spyOn(tipbot, "parseTipAmount").mockReturnValueOnce(mockTipAmount)
    jest
      .spyOn(tipbot, "isTokenSupported")
      .mockResolvedValueOnce(isTokenSupportedRes)
    jest.spyOn(tipbot, "parseMoniker").mockResolvedValueOnce(parseMonikerRes)
    const output = await processor.getAirdropArgs(i)
    expect(output).toEqual(mockResult)
  })
})

describe("airdrop", () => {
  let i: CommandInteraction

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))
  afterEach(() => jest.clearAllMocks())

  test("insufficient balance", async () => {
    const mockParsedArgs = {
      amount: 0.4,
      token: "COFFEE",
      duration: 180,
      entries: 10,
      all: false,
    }
    jest
      .spyOn(processor, "getAirdropArgs")
      .mockResolvedValueOnce(mockParsedArgs)
    jest.spyOn(tipbot, "getBalances").mockResolvedValueOnce([])

    await expect(processor.airdrop(i)).rejects.toThrow(
      new InsufficientBalanceError({
        msgOrInteraction: i,
        params: {
          current: 0,
          required: 0.4,
          symbol: "BTC",
        },
      })
    )
  })
})
