import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { getEmoji } from "utils/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/defi")

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["monikers"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("remove moniker successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("remove")
    i.options.getString = jest.fn().mockReturnValueOnce("cafe")
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Successfully removed`,
      description: `**cafe** is removed. To set the new one, run $moniker set <moniker> <amount_token> <token>. <a:bucket_cash:933020342035820604>`,
    })

    jest.spyOn(processor, "handleRemoveMoniker").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })

    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>

    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
