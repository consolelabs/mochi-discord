import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage, getSuccessEmbed } from "ui/discord/embed"

describe("run", () => {
  let i: CommandInteraction
  const verifyCmd = slashCommands["verify"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("verify remove successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("remove")
    const expected = getSuccessEmbed({
      title: "Channel removed",
      description: `Instruction message removed\n**NOTE**: not having a channel for verification will limit the capabilities of Mochi, we suggest you set one by running \`$verify set #<channel_name>\``,
    })
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })

  test("verify remove fail", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("remove")
    const expected = composeEmbedMessage(null, {
      title: "No config found",
      description: "No verify channel to remove",
    })
    jest.spyOn(processor, "runVerifyRemove").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await verifyCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
