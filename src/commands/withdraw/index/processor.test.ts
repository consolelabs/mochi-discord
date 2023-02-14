import Defi from "adapters/defi"
import { Collection, Message } from "discord.js"
import { APIError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")
jest.mock("utils/common")

describe("getDestinationAddress", () => {
  const interaction = mockdc.cloneCommandInteraction()
  const msg = mockdc.cloneMessage()
  const mockedCollectedMessage = mockdc.cloneMessage()
  mockedCollectedMessage.content = "0xE409E073eE7474C381BFD9b3f88098499123123"
  const mockedCollected = new Collection<string, Message<boolean>>()
  mockedCollected.set("test", mockedCollectedMessage)

  const mockedDm = mockdc.cloneMessage()
  mockedDm.channel.awaitMessages = jest.fn().mockResolvedValue(mockedCollected)

  test("getSuccess using Message", async () => {
    const output = await processor.getDestinationAddress(msg, mockedDm)
    expect(output).toEqual("0xE409E073eE7474C381BFD9b3f88098499123123")
  })

  test("getSuccess using Message", async () => {
    const output = await processor.getDestinationAddress(interaction, mockedDm)
    expect(output).toEqual("0xE409E073eE7474C381BFD9b3f88098499123123")
  })
})

describe("withdraw", () => {
  const msg = mockdc.cloneMessage()
  msg.author.send = jest.fn().mockResolvedValueOnce(undefined)

  afterEach(() => jest.clearAllMocks())

  test("msg.author.send should be called once", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    const mockedResponse = {
      ok: true,
      data: {
        amount: 1,
        tx_hash: "0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
        tx_url:
          "https://ftmscan.com/tx/0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
      },
    }
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    Defi.offchainDiscordWithdraw = jest
      .fn()
      .mockResolvedValueOnce(mockedResponse)
    await processor.withdraw(msg, args)
    expect(msg.author.send).toHaveBeenCalledTimes(1)
  })

  test("insufficient balance", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce({})
    Defi.offchainDiscordWithdraw = jest.fn()
    await processor.withdraw(msg, args)
    expect(Defi.offchainDiscordWithdraw).not.toHaveBeenCalled()
  })

  test("invalid amount", async () => {
    const args = [
      "withdraw",
      "-1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    await expect(processor.withdraw(msg, args)).rejects.toThrow(
      DiscordWalletTransferError
    )
  })
})

describe("withdrawSlash", () => {
  const interaction = mockdc.cloneCommandInteraction()

  afterEach(() => jest.clearAllMocks())

  test("interaction.user.send should be called once", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    const mockedResponse = {
      ok: true,
      data: {
        amount: 1,
        tx_hash: "0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
        tx_url:
          "https://ftmscan.com/tx/0x3b47c97f3f7bf3b462eba7b2b546f927a3b59be7103ff0439123123",
      },
    }
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    Defi.offchainDiscordWithdraw = jest
      .fn()
      .mockResolvedValueOnce(mockedResponse)
    await processor.withdrawSlash(interaction, args[1], args[2], args[3])
    expect(interaction.user.send).toHaveBeenCalledTimes(1)
  })

  test("withdrawal failed due to api error", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    Defi.offchainDiscordWithdraw = jest.fn().mockResolvedValueOnce({
      ok: false,
      data: null,
    })
    await expect(
      processor.withdrawSlash(interaction, args[1], args[2], args[3])
    ).rejects.toThrow(APIError)
  })
})
