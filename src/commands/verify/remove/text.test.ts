import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"

describe("run", () => {
  let msg: Message
  const commandKey = "verify"
  const commandAction = "remove"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const verifyCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("verify remove success", async () => {
    msg.content = `$verify remove`
    const expected = getSuccessEmbed({
      title: "Channel removed",
      description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
    })
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify remove fail", async () => {
    msg.content = `$verify remove`
    const expected = composeEmbedMessage(null, {
      title: "No config found",
      description: "No verify channel to remove",
    })
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
