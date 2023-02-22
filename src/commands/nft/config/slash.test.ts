import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { getSuccessEmbed } from "ui/discord/embed"
jest.mock("adapters/community")

describe("run", () => {
  let i: CommandInteraction
  const nftCmd = slashCommands["nft"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("nft add successfully", async () => {
    i.options.getSubcommand = jest
      .fn()
      .mockReturnValueOnce("config_twitter-sale")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("J9ts")
      .mockReturnValueOnce("hNl8")
      .mockReturnValueOnce("1450")
      .mockReturnValueOnce("P0Vv")
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Twitter sale config",
            description: `Successfully set configs.`,
          }),
        ],
      },
    }
    jest.spyOn(processor, "handle").mockResolvedValueOnce(expected)
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
