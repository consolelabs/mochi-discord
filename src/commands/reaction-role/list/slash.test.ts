import { CommandInteraction, MessageOptions, Role } from "discord.js"
import { slashCommands } from "commands"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { getEmojiURL, emojis } from "utils/common"
import * as processor from "./processor"
import { PREFIX } from "utils/constants"

describe("run", () => {
  let i: CommandInteraction
  const rrCmd = slashCommands["reactionrole"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run success", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("list")
    i.options.getRole = jest.fn().mockReturnValueOnce({ id: "123123" } as Role)
    const expected = composeEmbedMessage(null, {
      author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
      description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\``,
    })
    jest.spyOn(processor, "handleRoleList").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd.run(i)) as RunResult<MessageOptions>
    expect(processor.handleRoleList).toBeCalledWith(i)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
