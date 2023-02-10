import { slashCommands } from "commands"
import { CommandInteraction } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as depositSlash from "./slash"

describe("run", () => {
  let i: CommandInteraction
  const depositCmd = slashCommands["deposit"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("run with proper args", async () => {
    i.options.getString = jest.fn().mockReturnValue("ftm")
    jest.spyOn(depositSlash, "run").mockResolvedValueOnce({} as any)
    await depositCmd.run(i)
    expect(depositSlash.run).toHaveBeenCalledWith(i, "ftm")
  })
})
