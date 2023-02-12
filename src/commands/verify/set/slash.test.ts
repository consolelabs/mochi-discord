import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { defaultEmojis } from "utils/common"

describe("run", () => {
  let i: CommandInteraction
  const verifyCmd = slashCommands["verify"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("verify set successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("set")
    i.options.getChannel = jest.fn().mockReturnValueOnce("123123")
    const expected = getSuccessEmbed({
      title: "Channel set",
      description: `Mochi sent verify instructions to <#123123> channel`,
    })
    jest.spyOn(processor, "runVerifySet").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify set fail", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("set")
    i.options.getChannel = jest.fn().mockReturnValueOnce("123123")
    const expected = getErrorEmbed({
      title: "Verified channel error",
      description: `The current verified channel is <#123123>.\n${defaultEmojis.POINT_RIGHT} You need to remove the existing configuration first via \`verify remove\`, before setting a new one.`,
    })
    jest.spyOn(processor, "runVerifySet").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
