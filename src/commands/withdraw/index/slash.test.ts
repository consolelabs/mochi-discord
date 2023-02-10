import { slashCommands } from "commands"
import { CommandInteraction, Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import Defi from "adapters/defi"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  let i: CommandInteraction
  const withdrawCmd = slashCommands["withdraw"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("missing arguments error", async () => {
    i.options.getNumber = jest.fn().mockReturnValueOnce(null)
    i.options.getString = jest.fn().mockReturnValueOnce(null)
    const output = (await withdrawCmd.run(i)) as RunResult<MessageOptions>
    const expected = {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Missing arguments",
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })

  test("insufficient balance", async () => {
    i.options.getNumber = jest.fn().mockReturnValueOnce(1)
    i.options.getString = jest.fn().mockReturnValueOnce("ftm")
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
    const output = (await withdrawCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expectedEmbed)
  })

  test("successfully run with proper args", async () => {
    const mockedDmMsg = {
      url: "test",
    } as Message
    i.options.getNumber = jest.fn().mockReturnValueOnce(1)
    i.options.getString = jest.fn().mockReturnValueOnce("ftm")
    i.user.send = jest.fn().mockResolvedValueOnce(mockedDmMsg)
    i.followUp = jest.fn().mockResolvedValueOnce(undefined)

    Defi.getInsuffientBalanceEmbed = jest.fn().mockResolvedValueOnce(null)
    jest
      .spyOn(processor, "getDestinationAddress")
      .mockResolvedValueOnce("0xE409E073eE7474C381BFD9b3f88098499123123")
    jest.spyOn(processor, "withdrawSlash").mockResolvedValueOnce(undefined)
    await withdrawCmd.run(i)
    expect(processor.withdrawSlash).toHaveBeenCalledWith(
      i,
      "1",
      "ftm",
      "0xE409E073eE7474C381BFD9b3f88098499123123"
    )
  })
})
