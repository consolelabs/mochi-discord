import { slashCommands } from "commands"
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageOptions,
} from "discord.js"
import { RunResult } from "types/common"
import * as processor from "./processor"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { GuildIdNotFoundError } from "errors"
jest.mock("adapters/config")

describe("run", () => {
  let i: CommandInteraction
  const questCmd = slashCommands["quest"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("quest successfully", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValueOnce("daily")
    i.user.id = "123123"

    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Daily Quests",
            description: `${[
              `**Quests will refresh in \`1\`h \`1\`m**`,
              "Completing all quests will reward you with a bonus!",
              "Additionally, a high `$vote` streak can also increase your reward",
            ].join("\n")}\n\n**Completion Progress**`,
            thumbnail: getEmojiURL(emojis.CHEST),
            color: "#d6b12d",
          }),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setDisabled(true)
              .setStyle("SECONDARY")
              .setEmoji(getEmoji("CHECK"))
              .setCustomId("claim-rewards-daily_123123")
              .setLabel("No rewards to claim")
          ),
        ],
      },
    }
    jest
      .spyOn(processor, "run")
      .mockResolvedValueOnce({ msgOpts: expected.messageOptions })

    const output = (await questCmd.run(i)) as RunResult<MessageOptions>

    expect(processor.run).toHaveBeenCalled()
    assertRunResult(output, expected)
  })

  test("guild not found", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("daily")
    i.guildId = null
    await expect(questCmd.run(i)).rejects.toThrow(GuildIdNotFoundError)
  })
})
