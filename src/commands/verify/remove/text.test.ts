import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
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
    const expected = {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            title: "Channel removed",
            description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
          }),
        ],
      },
    }
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce(expected)
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })

  test("verify remove fail", async () => {
    msg.content = `$verify remove`
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No config found",
            description:
              "No verify channel to remove, to set one run `$verify set`",
          }),
        ],
      },
    }
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce(expected)
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
