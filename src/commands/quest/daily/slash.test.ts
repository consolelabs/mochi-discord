import { slashCommands } from "commands"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import {
  assertDescription,
  assertThumbnail,
  assertTitle,
} from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL } from "utils/common"
import { GuildIdNotFoundError } from "errors"
jest.mock("adapters/config")

describe("run", () => {
  let i: CommandInteraction
  const questCmd = slashCommands["quest"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("quest successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("daily")
    i.user.id = "123123"

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

    const output = (await questCmd.run(i)) as RunResult<MessageOptions>

    expect(processor.run).toHaveBeenCalled()
    assertTitle(output, expected)
    assertDescription(output, expected)
    assertThumbnail(output, expected)
  })

  test("guild not found", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("daily")
    i.guildId = null
    await expect(questCmd.run(i)).rejects.toThrow(GuildIdNotFoundError)
  })
})
