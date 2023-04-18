import { userMention } from "@discordjs/builders"
import { slashCommands } from "commands"
import { CommandInteraction } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let i: CommandInteraction
  const tipCmd = slashCommands["tip"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("sucessfully", async () => {
    const recipient = userMention("521591222826041344")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce(recipient)
      .mockReturnValueOnce("cake")
      .mockReturnValueOnce(null)
      .mockReturnValueOnce("hpny")
    i.options.getNumber = jest.fn().mockReturnValueOnce(1.5)
    jest.spyOn(processor, "tip").mockResolvedValueOnce(undefined)
    await tipCmd.run(i)
    const args = ["tip", "<@521591222826041344>", "1.5", "cake", `"hpny"`]
    expect(processor.tip).toBeCalledWith(i, args)
  })
})
