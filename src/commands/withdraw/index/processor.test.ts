import Defi from "adapters/defi"
import { Collection, Message } from "discord.js"
import { APIError } from "errors"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL, roundFloatNumber } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
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
    const expectedEmbed = composeEmbedMessage(null, {
      author: ["Withdraw"],
      title: `${getEmoji(args[2])} FTM sent`,
      description: "Your withdrawal was processed succesfully!",
    }).addFields(
      {
        name: "Destination address",
        value: "`0xE409E073eE7474C381BFD9b3f88098499123123`",
        inline: false,
      },
      {
        name: "Withdrawal amount",
        value: `**1** ${getEmoji(args[2])}`,
        inline: true,
      },
      {
        name: "Withdrawal Transaction ID",
        value: `[${mockedResponse.data.tx_hash}](${mockedResponse.data.tx_url})`,
        inline: false,
      }
    )
    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    Defi.offchainDiscordWithdraw = jest
      .fn()
      .mockResolvedValueOnce(mockedResponse)
    await processor.withdraw(msg, args)
    expect(msg.author.send).toHaveBeenCalledTimes(1)
    expect(msg.author.send).toHaveBeenCalledWith({ embeds: [expectedEmbed] })
  })

  test("insufficient balance", async () => {
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    const expectedEmbed = composeEmbedMessage(null, {
      author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
      description: `<@${msg.author.id}>, your balance is insufficient.\nYou can deposit more by using \`$deposit ${args[2]}\``,
    })
      .addField(
        "Required amount",
        `${getEmoji("ftm")} ${roundFloatNumber(1, 4)} ftm`,
        true
      )
      .addField(
        "Your balance",
        `${getEmoji("ftm")} ${roundFloatNumber(0, 4)} ftm`,
        true
      )
    Defi.getInsuffientBalanceEmbed = jest
      .fn()
      .mockResolvedValueOnce(expectedEmbed)
    Defi.offchainDiscordWithdraw = jest.fn()
    const output = await processor.withdraw(msg, args)
    expect(Defi.offchainDiscordWithdraw).not.toHaveBeenCalled()
    assertRunResult(
      { messageOptions: { ...output } },
      { messageOptions: { embeds: [expectedEmbed] } }
    )
  })

  test("invalid amount", async () => {
    const args = [
      "withdraw",
      "-1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    await expect(processor.withdraw(msg, args)).rejects.toThrow(
      new DiscordWalletTransferError({
        discordId: msg.author.id,
        message: msg,
        error: "No valid recipient found!",
      })
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
      curl: "",
      error: "",
      log: "",
    })
    await expect(
      processor.withdrawSlash(interaction, args[1], args[2], args[3])
    ).rejects.toThrow(new APIError({ description: "", curl: "", error: "" }))
  })
})
