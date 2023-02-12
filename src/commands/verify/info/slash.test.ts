import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"

describe("run", () => {
  let i: CommandInteraction
  const verifyCmd = slashCommands["verify"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("verify info successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("info")
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
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify info successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("info")
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
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
