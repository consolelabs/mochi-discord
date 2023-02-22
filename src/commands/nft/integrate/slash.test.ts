import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"

describe("nft intergrate", () => {
  let i: CommandInteraction
  const nftCmd = slashCommands["nft"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("nft integrated successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("integrate")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("0x7acee5d0acc520fab33b3ea25d4feef1ffebde73")
      .mockReturnValueOnce("ftm")
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "ABC integrated",
            description:
              "ABC collection is now ready to take part in our verse (added + enabled)",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftIntegrateCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft integrated failed", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("integrate")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("0x7acee5d0acc520fab33b3ea25d4feef1ff")
      .mockReturnValueOnce("btc")
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Cannot found metadata for this collection",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftIntegrateCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
