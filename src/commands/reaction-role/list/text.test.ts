import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const rrCmd = commands["reactionrole"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("set reaction role successfully", async () => {
    msg.content =
      "$rr set https://discord.com/channels/test/test/test <:emoji:123123> <@&123123>"
    const expected = composeEmbedMessage(null, {
      author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
      description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\``,
    })
    jest.spyOn(processor, "handleRoleList").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd?.actions?.["list"].run(
      msg
    )) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
