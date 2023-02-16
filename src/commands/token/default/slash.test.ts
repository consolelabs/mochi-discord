import { CommandInteraction } from "discord.js"
import { slashCommands } from "commands"
import * as processor from "./processor"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let i: CommandInteraction
  const tokenCmd = slashCommands["token"]
  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("default")
    i.options.getString = jest.fn().mockResolvedValue("ftm")
    const expectedEmbed = {
      embeds: [
        composeEmbedMessage(null, {
          description: `Successfully set **FTM** as default token for server`,
        }),
      ],
    }
    jest
      .spyOn(processor, "handleTokenDefault")
      .mockResolvedValueOnce(expectedEmbed)
    const output = await tokenCmd.run(i)
    expect(processor.handleTokenDefault).toBeCalledWith(i, "ftm")
    assertRunResult(output as any, { messageOptions: expectedEmbed })
  })
})
