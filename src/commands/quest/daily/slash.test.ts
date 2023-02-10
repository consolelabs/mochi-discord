import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
jest.mock("adapters/config")

describe("run", () => {
  let i: CommandInteraction
  const nftCmd = slashCommands["quest"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("nft add successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("daily")
    const expected = composeEmbedMessage(null, {
      title: "Daily Quests",
      description: `${[
        `**Quests will refresh in \`1\`h \`1\`m**`,
        "Completing all quests will reward you with a bonus!",
        "Additionally, a high `$vote` streak can also increase your reward",
      ].join("\n")}\n\n**Completion Progress**`,
      thumbnail: getEmojiURL(emojis.CHEST),
      footer: ["Daily quests reset at 00:00 UTC"],
      color: "#d6b12d",
    })
    jest.spyOn(processor, "run").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })
    const output = (await nftCmd.run(i)) as RunResult<MessageOptions>
    assertTitle(output, expected)
    assertDescription(output, expected)
  })
})
