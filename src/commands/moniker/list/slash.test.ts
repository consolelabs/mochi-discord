import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { getEmoji } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["moniker"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("moniker default list successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("list")
    const expected = new MessageEmbed({
      title: `${getEmoji("bucket_cash")} Moniker List`,
    })
    expected
      .addFields({
        name: "\u200B",
        value: `This is our default moniker! ${getEmoji(
          "boo"
        )}\n👉 To set yours, run $monikers set \`<moniker> <amount_token> <token>\`!`,
      })
      .addFields(
        { name: "Moniker", value: "cafe", inline: true },
        { name: "Value", value: "0.01 ETH", inline: true }
      )
    jest.spyOn(processor, "handleMonikerList").mockResolvedValueOnce([expected])
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    expect(processor.handleMonikerList).toBeCalledWith(i.guildId)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })

  test("moniker default list successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("list")
    const expected = new MessageEmbed({
      title: `${getEmoji("bucket_cash")} Moniker List`,
    })
    expected
      .addFields({
        name: "\u200B",
        value:
          "👉To set more monikers, run `$monikers set <moniker> <amount_token> <token>`!\n👉 For example, try `$monikers set tea 1 BUTT`",
      })
      .addFields(
        { name: "Moniker", value: "cafe", inline: true },
        { name: "Value", value: "0.01 ETH", inline: true }
      )
    jest.spyOn(processor, "handleMonikerList").mockResolvedValueOnce([expected])
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    expect(processor.handleMonikerList).toBeCalledWith(i.guildId)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
