import { MessageActionRow, MessageButton } from "discord.js"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { getEmojiURL, emojis, getEmoji, msgColors } from "utils/common"
import community from "adapters/community"
import dayjs from "dayjs"
jest.mock("adapters/config")

describe("run", () => {
  afterEach(() => jest.clearAllMocks())

  test("run success", async () => {
    jest.spyOn(community, "getListQuest").mockResolvedValueOnce({
      ok: true,
      data: [],
    } as any)

    const nowUtc = dayjs().utc()
    const resetUtc = dayjs().endOf("day").utc(true)

    const hour = resetUtc.diff(nowUtc, "hour")
    const minute = Math.round(resetUtc.diff(nowUtc, "minute") % 60)
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Daily Quests",
            description: `${[
              `**Quests will refresh in \`${hour}\`h \`${minute}\`m**`,
              "Completing all quests will reward you with a bonus!",
              "Additionally, a high `$vote` streak can also increase your reward",
            ].join("\n")}\n\n**Completion Progress**`,
            thumbnail: getEmojiURL(emojis.CHEST),
            color: msgColors.YELLOW,
            footer: ["Daily quests reset at 00:00 UTC"],
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

    const output = await processor.run("123123")
    assertRunResult(output, expected)
  })
})
