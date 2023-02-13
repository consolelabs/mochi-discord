import { CommandInteraction } from "discord.js"
import { slashCommands } from "commands"
import * as processor from "./processor"
import mockdc from "../../../../tests/mocks/discord"

describe("run", () => {
  let i: CommandInteraction
  const tokenCmd = slashCommands["token"]
  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("list")
    jest.spyOn(processor, "handleTokenList").mockResolvedValueOnce({} as any)
    await tokenCmd.run(i)
    expect(processor.handleTokenList).toBeCalledWith(i.guildId)
  })
})
