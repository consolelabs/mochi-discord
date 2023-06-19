import { CommandInteraction, MessageOptions, Role } from "discord.js"
import { slashCommands } from "commands"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../../tests/assertions/discord"
import mockdc from "../../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let i: CommandInteraction
  const rrCmd = slashCommands["role"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("remove a specifig cfg from msg - run with enough args", async () => {
    const emoji = "<:test:123123>"
    const msgLink = "https://discord.com/channels/test/test/test"
    i.options.getSubcommandGroup = jest.fn().mockReturnValue("reaction")
    i.options.getSubcommand = jest.fn().mockReturnValue("remove")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce(msgLink)
      .mockReturnValueOnce(emoji)
    i.options.getRole = jest.fn().mockReturnValueOnce({ id: "123123" } as Role)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction roles", ""],
      description: "Reaction <:test:123123> is removed for <@&123123>.",
    })
    jest.spyOn(processor, "handleRoleRemove").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd.run(i)) as RunResult<MessageOptions>
    const args = [
      "",
      "",
      "https://discord.com/channels/test/test/test",
      "<:test:123123>",
      "123123",
    ]
    expect(processor.handleRoleRemove).toBeCalledWith(args, i)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })

  test("remove all cfg from msg - run with enough args", async () => {
    const msgLink = "https://discord.com/channels/test/test/test"
    i.options.getSubcommandGroup = jest.fn().mockReturnValue("reaction")
    i.options.getSubcommand = jest.fn().mockReturnValue("remove")
    i.options.getString = jest.fn().mockReturnValueOnce(msgLink)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction roles", ""],
      description:
        "All reaction role configurations for this message is now clear.",
    })
    jest.spyOn(processor, "handleRoleRemove").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd.run(i)) as RunResult<MessageOptions>
    const args = ["", "", "https://discord.com/channels/test/test/test", "", ""]
    expect(processor.handleRoleRemove).toBeCalledWith(args, i)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
