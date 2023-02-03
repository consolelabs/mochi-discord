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

  test("remove moniker successfully", async () => {
    i.options.getString = jest.fn().mockReturnValueOnce("cafe")
    i.options.getNumber = jest.fn().mockReturnValueOnce(1.5)
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Successfully removed`,
      description: `**cafe**  is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. ${getEmoji(
        "bucket_cash"
      )}`,
    })
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
