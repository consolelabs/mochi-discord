import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { defaultEmojis, emojis, getEmojiURL } from "utils/common"

describe("run", () => {
  let msg: Message
  const commandKey = "verify"
  const commandAction = "info"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const verifyCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("verify info success", async () => {
    msg.content = `$verify info`
    const expected = composeEmbedMessage(null, {
      author: ["Verify", getEmojiURL(emojis.APPROVE)],
      description: `Verify channel: <#111>\nVerify role: <@&$123>`,
      footer: ["To change verify channel and role, use $verify remove"],
    })
    jest.spyOn(processor, "runVerify").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify info fail", async () => {
    msg.content = `$verify info`
    const expected = composeEmbedMessage(null, {
      title: "No verified channel found",
      author: ["Verify", getEmojiURL(emojis.APPROVE)],
      description: `You haven't set a channel for verification.\n${defaultEmojis.POINT_RIGHT} To set a new one, run \`verify set #<channel> @<verified role>\`.\n${defaultEmojis.POINT_RIGHT} Then re-check your configuration using \`verify info.\``,
    })
    jest.spyOn(processor, "runVerify").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
