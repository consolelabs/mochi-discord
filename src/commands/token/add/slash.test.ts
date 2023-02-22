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
    i.options.getSubcommand = jest.fn().mockReturnValue("add")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Need action",
            description:
              "Select to add one of the following tokens to your server.",
          }),
        ],
        components: [undefined, undefined],
      },
      interactionOptions: {
        handler: () => null,
      },
    }
    jest
      .spyOn(processor, "handleTokenAdd")
      .mockResolvedValueOnce(expected as any)
    const output = await tokenCmd.run(i)
    expect(processor.handleTokenAdd).toBeCalledWith(i, i.guildId, i.user.id)
    assertRunResult(output as any, expected as any)
  })
})
