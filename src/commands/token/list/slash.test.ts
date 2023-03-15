import { CommandInteraction } from "discord.js"
import { slashCommands } from "commands"
import * as processor from "./processor"
import mockdc from "../../../../tests/mocks/discord"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let i: CommandInteraction
  const tokenCmd = slashCommands["token"]
  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("list")
    const expected = {
      messageOptions: {
        embeds: [
          {
            color: "#77b255",
            title: ":dollar: Tokens list",
            fields: [],
          },
        ],
      },
    }
    jest
      .spyOn(processor, "handleTokenList")
      .mockResolvedValueOnce(expected as any)
    const output = await tokenCmd.run(i)
    expect(processor.handleTokenList).toBeCalled()
    assertRunResult(output as any, expected as any)
  })
})
