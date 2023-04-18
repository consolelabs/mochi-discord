import { Collection, Message } from "discord.js"
import { InternalError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { InsufficientBalanceError } from "errors/insufficient-balance"
import { getEmoji } from "utils/common"
import * as dcutils from "utils/discord"
import * as tiputils from "utils/tip-bot"
import mockdc from "../../../../tests/mocks/discord"
import mochiPay from "../../../adapters/mochi-pay"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("getRecipient", () => {
  const msg = mockdc.cloneMessage()
  const collectedMsg = mockdc.cloneMessage()
  const recipientAddr = "0xA94FCFbf927594702f8F0Eb7532f35928F32410b"
  collectedMsg.content = recipientAddr
  const mockedCollected = new Collection<string, Message<boolean>>()
  mockedCollected.set("test", collectedMsg)

  const mockedDm = mockdc.cloneMessage()
  mockedDm.channel.awaitMessages = jest.fn().mockResolvedValue(mockedCollected)

  test("valid address", async () => {
    jest.spyOn(dcutils, "awaitMessage").mockResolvedValueOnce({
      first: collectedMsg,
      content: collectedMsg.content,
    })
    const output = await processor.getRecipient(msg, mockedDm, "FTM")
    expect(output).toEqual(recipientAddr)
  })

  test("invalid address", async () => {
    collectedMsg.content = "abc"
    jest.spyOn(dcutils, "awaitMessage").mockResolvedValueOnce({
      first: collectedMsg,
      content: collectedMsg.content,
    })
    const output = await processor.getRecipient(msg, mockedDm, "FTM")
    expect(output).toEqual("")
    expect(collectedMsg.reply).toHaveBeenCalledTimes(1)
  })
})

describe("getWithdrawPayload", () => {
  let msg: Message = mockdc.getMessage()

  afterEach(() => {
    msg = mockdc.cloneMessage()
    jest.clearAllMocks()
  })

  test("invalid amount => throw DiscordWalletTransferError", async () => {
    await expect(processor.getWithdrawPayload(msg, "a", "ETH")).rejects.toThrow(
      new DiscordWalletTransferError({
        message: msg,
        discordId: msg.author.id,
        error: "The amount is invalid. Please insert a natural number.",
      })
    )
  })

  test("withdraw all", async () => {
    msg.content = `$wd all eth`
    const output = await processor.getWithdrawPayload(msg, "all", "ETH")
    expect(output).toEqual({
      recipient: msg.author.id,
      recipientAddress: "",
      guildId: msg.guildId,
      channelId: msg.channelId,
      amount: 0,
      token: "ETH",
      each: false,
      all: true,
      transferType: "withdraw",
      duration: 0,
      fullCommand: msg.content,
    })
  })

  test("valid amount", async () => {
    msg.content = `$wd all eth`
    const output = await processor.getWithdrawPayload(msg, "0.69", "ETH")
    expect(output).toEqual({
      recipient: msg.author.id,
      recipientAddress: "",
      guildId: msg.guildId,
      channelId: msg.channelId,
      amount: 0.69,
      token: "ETH",
      each: false,
      all: false,
      transferType: "withdraw",
      duration: 0,
      fullCommand: msg.content,
    })
  })
})

describe("withdraw", () => {
  let msg: Message = mockdc.getMessage()
  msg.author.send = jest.fn().mockResolvedValueOnce(undefined)

  afterEach(() => {
    msg = mockdc.cloneMessage()
    jest.clearAllMocks()
  })

  test("token not supported", async () => {
    const addr = "0xE409E073eE7474C381BFD9b3f88098499123123"
    jest.spyOn(processor, "getRecipient").mockResolvedValueOnce(addr)

    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(false)
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    await expect(processor.withdraw(msg, "1", "qwerty" as any)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Unsupported token",
        description: `**QWERTY** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
      })
    )
  })

  test("no balance => throw InsufficientBalanceError", async () => {
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    mochiPay.getBalances = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, data: [] })
    await expect(processor.withdraw(msg, "10", "FTM")).rejects.toThrow(
      new InsufficientBalanceError({
        msgOrInteraction: msg,
        params: { current: 0, required: 10, symbol: "FTM" },
      })
    )
  })

  test("insufficient balance => throw InsufficientBalanceError", async () => {
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce({
      ok: true,
      data: [
        {
          token: { symbol: "ftm", name: "fantom" },
          amount: 5600000000000000000,
        },
      ],
    })
    await expect(processor.withdraw(msg, "10", "FTM")).rejects.toThrow(
      new InsufficientBalanceError({
        msgOrInteraction: msg,
        params: { current: 5.6, required: 10, symbol: "FTM" },
      })
    )
  })

  test("successfully withdraw", async () => {
    jest.spyOn(tiputils, "isTokenSupported").mockResolvedValueOnce(true)
    const addr = "0xE409E073eE7474C381BFD9b3f88098499123123"
    // const mockedResponse = {
    //   ok: true,
    //   data: {
    //     amount: 1,
    //     tx_hash: "0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
    //     tx_url:
    //       "https://ftmscan.com/tx/0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
    //   },
    // }
    const collectedMsg = mockdc.cloneMessage()
    collectedMsg.content = addr
    jest.spyOn(processor, "getRecipient").mockResolvedValueOnce(addr)
    // defi.offchainDiscordWithdraw = jest
    //   .fn()
    //   .mockResolvedValueOnce(mockedResponse)
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce({
      ok: true,
      data: [
        {
          token: { name: "fantom", symbol: "ftm", decimal: 18 },
          amount: 5600000000000000000,
        },
      ],
    })
    const mockedDm = mockdc.cloneMessage()
    msg.author.send = jest.fn().mockResolvedValueOnce(mockedDm)
    await processor.withdraw(msg, "1", "FTM")
    expect(msg.author.send).toHaveBeenCalledTimes(2)
  })
})
