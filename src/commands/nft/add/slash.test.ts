import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import nft from ".."
jest.mock("adapters/community")

describe("run", () => {
  let i: CommandInteraction
  const nftCmd = nft.slashCmd

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("nft add successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("add")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("0x51081a152db09d3FfF75807329A3A8b538eCf73b")
      .mockReturnValueOnce("ftm")
    i.options.getNumber = jest.fn().mockReturnValueOnce(0.01)
    const expected = {
      messageOptions: {
        embeds: [
          new MessageEmbed({
            title: "NFT",
            description: "Successfully add new collection to queue",
          }),
        ],
      },
    }
    jest
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("nft add error", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("add")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("0x51081a152db09d3FfF75807329A3A8b538eCf73b")
      .mockReturnValueOnce("etf")
    i.options.getNumber = jest.fn().mockReturnValueOnce(0.01)
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
      .spyOn(processor, "executeNftAddCommand")
      .mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
