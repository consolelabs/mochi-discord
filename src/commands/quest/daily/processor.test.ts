import { Message } from "discord.js"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { getEmojiURL, emojis } from "utils/common"
import community from "adapters/community"
import mockdc from "../../../../tests/mocks/discord"
import dayjs from "dayjs"
jest.mock("adapters/config")

describe("run", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))

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
    const expected = composeEmbedMessage(msg, {
      title: "Daily Quests",
      description: `${[
        `**Quests will refresh in \`${hour}\`h \`${minute}\`m**`,
        "Completing all quests will reward you with a bonus!",
        "Additionally, a high `$vote` streak can also increase your reward",
      ].join("\n")}\n\n**Completion Progress**`,
      thumbnail: getEmojiURL(emojis.CHEST),
    })

    const output = await processor.run("123123")
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
