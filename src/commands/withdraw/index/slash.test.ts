import { slashCommands } from "commands"
import { CommandInteraction } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  let i: CommandInteraction
  const withdrawCmd = slashCommands["withdraw"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("successfully run with proper args", async () => {
    const mockedDmMsg = mockdc.cloneMessage()
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("1")
      .mockReturnValueOnce("ftm")
    i.user.send = jest.fn().mockResolvedValueOnce(mockedDmMsg)
    i.followUp = jest.fn().mockResolvedValueOnce(undefined)

    jest
      .spyOn(processor, "getRecipient")
      .mockResolvedValueOnce("0xE409E073eE7474C381BFD9b3f88098499123123")
    jest.spyOn(processor, "withdraw").mockResolvedValueOnce(undefined)
    await withdrawCmd.run(i)
    expect(processor.withdraw).toHaveBeenCalledWith(i, "1", "FTM")
  })
})
