import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const rrCmd = commands["reactionrole"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("set reaction role successfully", async () => {
    msg.content =
      "$rr set https://discord.com/channels/test/test/test <:emoji:123123> <@&123123>"
    const expected = composeEmbedMessage(msg, {
      author: ["Reaction role set!", getEmojiURL(emojis["APPROVE"])],
      description: "Emoji <:emoji:123123> is now set to this role <@&123123>",
      color: msgColors.SUCCESS,
    })
    jest.spyOn(processor, "handleRoleSet").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd?.actions?.["set"].run(
      msg
    )) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
