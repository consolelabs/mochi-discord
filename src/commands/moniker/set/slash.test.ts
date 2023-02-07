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

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["monikers"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("set moniker successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("set")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("cafe")
      .mockReturnValueOnce("ETH")
    i.options.getNumber = jest.fn().mockReturnValueOnce(0.01)
    const expected = new MessageEmbed({
      title: `${getEmoji("approve")} Moniker successfully set`,
      description: `1 **cafe** is set as 0.01 **ETH**. To tip your friend moniker, use $tip <@users> <amount> <moniker>. <a:bucket_cash:933020342035820604>`,
    })
    jest.spyOn(processor, "handleSetMoniker").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
