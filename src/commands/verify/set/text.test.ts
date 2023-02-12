import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { defaultEmojis } from "utils/common"

describe("run", () => {
  let msg: Message
  const commandKey = "verify"
  const commandAction = "set"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const verifyCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("verify set success", async () => {
    msg.content = `$verify set <#123123>`
    const expected = getSuccessEmbed({
      title: "Channel set",
      description: `Mochi sent verify instructions to <#123123> channel`,
    })
    jest.spyOn(processor, "runVerifySet").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify set success 2", async () => {
    msg.content = `$verify set <#123123> <@&123456>`
    const expected = getSuccessEmbed({
      title: "Channel set",
      description: `Mochi sent verify instructions to <#123123> channel. In addition, user will be assigned role <@&123456> upon successful verification`,
    })
    jest.spyOn(processor, "runVerifySet").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify set failed", async () => {
    msg.content = `$verify set <#123123> <@&123456>`
    const expected = getErrorEmbed({
      title: "Verified channel error",
      description: `The current verified channel is <#123123>.\n${defaultEmojis.POINT_RIGHT} You need to remove the existing configuration first via \`verify remove\`, before setting a new one.`,
    })
    jest.spyOn(processor, "runVerifySet").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(msg)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
