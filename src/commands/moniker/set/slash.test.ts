import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { getErrorEmbed } from "ui/discord/embed"
import { getEmoji } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["moniker"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("missing arguments error", async () => {
    i.options.getString = jest.fn().mockReturnValue(null)
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    const expected = {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Missing arguments",
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })

  test("set moniker successfully", async () => {
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("cafe")
      .mockReturnValueOnce("0.01")
      .mockReturnValueOnce("eth")
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Moniker successfully set`,
      description: `1 **cafe** is set as 0.01 **ETH**. To tip your friend moniker, use $tip <@users> <amount> <moniker> . ${getEmoji(
        "bucket_cash"
      )}`,
    })
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
