import { CommandInteraction, MessageOptions, Role } from "discord.js"
import { slashCommands } from "commands"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { getEmojiURL, emojis, msgColors } from "utils/common"
import * as processor from "./processor"

describe("run", () => {
  let i: CommandInteraction
  const rrCmd = slashCommands["reactionrole"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    const emoji = "<:test:123123>"
    const msgLink = "https://discord.com/channels/test/test/test"
    i.options.getSubcommand = jest.fn().mockReturnValue("set")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce(msgLink)
      .mockReturnValueOnce(emoji)
    i.options.getRole = jest.fn().mockReturnValueOnce({ id: "123123" } as Role)
    const expected = composeEmbedMessage(null, {
      author: ["Reaction role set!", getEmojiURL(emojis["APPROVE"])],
      description: `Emoji ${emoji} is now set to this role <@&123123>`,
      color: msgColors.SUCCESS,
    })
    jest.spyOn(processor, "handleRoleSet").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd.run(i)) as RunResult<MessageOptions>
    const args = [
      "",
      "",
      "https://discord.com/channels/test/test/test",
      "<:test:123123>",
      "<@&123123>",
    ]
    expect(processor.handleRoleSet).toBeCalledWith(args, i)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
