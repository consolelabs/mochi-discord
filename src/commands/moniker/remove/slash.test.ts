import { slashCommands } from "commands"
import { CommandInteraction, MessageEmbed, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertAuthor,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"
jest.mock("adapters/defi")

describe("run", () => {
  let i: CommandInteraction
  const monikerCmd = slashCommands["moniker"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("remove moniker successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("remove")
    i.options.getString = jest.fn().mockReturnValueOnce("cafe")
    const expected = new MessageEmbed({
      author: {
        name: "Successfully removed",
        iconURL: getEmojiURL(emojis.BIN),
      },
      description: `[\`cafe\`](${HOMEPAGE_URL}) is removed from server\n${getEmoji(
        "pointingright"
      )} Set up a new moniker configuration \`${SLASH_PREFIX}moniker set\`\n${getEmoji(
        "pointingright"
      )} See all moniker configurations \`${SLASH_PREFIX}moniker list\``,
    })

    jest.spyOn(processor, "handleRemoveMoniker").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
      },
    })

    const output = (await monikerCmd.run(i)) as RunResult<MessageOptions>

    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
