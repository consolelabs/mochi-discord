import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
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

  test("remove a specific cfg successfully", async () => {
    msg.content =
      "$rr remove https://discord.com/channels/test/test/test <:emoji:123123> <@&123123>"
    const expected = composeEmbedMessage(msg, {
      author: ["Reaction roles", ""],
      description: "Reaction <:test:123123> is removed for <@&123123>.",
    })
    jest.spyOn(processor, "handleRoleRemove").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd?.actions?.["remove"].run(
      msg
    )) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("remove all configs successfully", async () => {
    msg.content = "$rr remove https://discord.com/channels/test/test/test"
    const expected = composeEmbedMessage(msg, {
      author: ["Reaction roles", ""],
      description:
        "All reaction role configurations for this message is now clear.",
    })
    jest.spyOn(processor, "handleRoleRemove").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await rrCmd?.actions?.["remove"].run(
      msg
    )) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
