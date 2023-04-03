import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertAuthor,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"
import { emojis, getEmojiURL } from "utils/common"

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["moniker"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("set moniker successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("set")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce("cafe")
      .mockReturnValueOnce("ETH")
    i.options.getNumber = jest.fn().mockReturnValueOnce(0.01)
    const expected = new MessageEmbed({
      author: {
        name: "Moniker successfully set",
        iconURL: getEmojiURL(emojis.CHECK),
      },
      description: `Moniker: [\`cafe\`](${HOMEPAGE_URL}) is set as 0.01 ETH\n\nUse \`${SLASH_PREFIX}tip users amount moniker\` to tip your friend with moniker\ne.g. \`${SLASH_PREFIX}tip @anna 1 cookie\`\nRelate commands: ${[
        "set",
        "remove",
        "list",
      ].map((c) => `\`${SLASH_PREFIX}${c}\``)}`,
    })
    jest.spyOn(processor, "handleSetMoniker").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })
    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
