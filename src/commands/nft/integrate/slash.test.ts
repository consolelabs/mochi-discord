import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/config")

describe("run", () => {
  let i: CommandInteraction
  const nftCmd = slashCommands["nft"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("nft integrated successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("integrate")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("J9ts")
      .mockReturnValueOnce("hNl8")
      .mockReturnValueOnce("1450")
      .mockReturnValueOnce("P0Vv")
    const expected = new MessageEmbed({
      title: "ABC integrated",
      description:
        "ABC collection is now ready to take part in our verse (added + enabled)",
    })
    jest.spyOn(processor, "executeNftIntegrateCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("nft integrated failed", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("integrate")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("J9ts")
      .mockReturnValueOnce("hNl8")
      .mockReturnValueOnce("1450")
      .mockReturnValueOnce("P0Vv")
    const expected = new MessageEmbed({
      title: "NFT",
      description: "Cannot found metadata for this collection",
    })
    jest.spyOn(processor, "executeNftIntegrateCommand").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
