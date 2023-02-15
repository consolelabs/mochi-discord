import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { InternalError } from "errors"
import { RunResult } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import Defi from "adapters/defi"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const withdrawCmd = commands["withdraw"]

  beforeEach(() => (msg = mockdc.cloneMessage()))
  afterEach(() => jest.clearAllMocks())

  test("invalid amount", async () => {
    msg.content = `$withdraw -1 ftm`
    // const output = () as RunResult<MessageOptions>
    await expect(withdrawCmd.run(msg)).rejects.toThrow(
      new InternalError({
        message: msg,
        title: "Withdraw failed!",
        description: "amount must be a positive number",
      })
    )
  })

  test("insufficient balance", async () => {
    msg.content = `$withdraw 5 ftm`
    const insuffientBalanceEmbedMock = composeEmbedMessage(null, {
      author: ["Insufficient balance", getEmojiURL(emojis.REVOKE)],
      description: `baka, your balance is insufficient.\nYou can deposit more by using \`$deposit ftm\``,
    })
    const expectedEmbed = {
      messageOptions: {
        embeds: [insuffientBalanceEmbedMock],
      },
    }
    Defi.getInsuffientBalanceEmbed = jest
      .fn()
      .mockResolvedValueOnce(insuffientBalanceEmbedMock)
    const output = (await withdrawCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expectedEmbed)
  })

  test("successfully run with proper args", async () => {
    const mockedDmMsg = mockdc.cloneMessage()
    const args = [
      "withdraw",
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123",
    ]
    msg.content = "$withdraw 1 ftm"
    msg.author.send = jest.fn().mockResolvedValueOnce(mockedDmMsg)
    msg.author.avatarURL = jest.fn().mockResolvedValueOnce(null)
    msg.reply = jest.fn().mockResolvedValueOnce(undefined)

    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    jest
      .spyOn(processor, "getDestinationAddress")
      .mockResolvedValueOnce("0xE409E073eE7474C381BFD9b3f88098499123123")
    jest.spyOn(processor, "withdraw").mockResolvedValueOnce(undefined)
    const output = await withdrawCmd.run(msg)
    expect(processor.withdraw).toHaveBeenCalledWith(msg, args)
    expect(output).toBeFalsy()
  })
})
