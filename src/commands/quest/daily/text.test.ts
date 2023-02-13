import { commands } from "commands"
import { Message, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertThumbnail,
  assertTitle,
} from "../../../../tests/assertions/discord"
import { emojis, getEmojiURL } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { GuildIdNotFoundError } from "errors"
jest.mock("adapters/config")

describe("run", () => {
  let msg: Message
  const commandKey = "quest"
  const commandAction = "daily"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const questCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("quest successfully", async () => {
    msg.content = `$quest`
    msg.author.id = "123123"

    const expected = composeEmbedMessage(null, {
      title: "Daily Quests",
      description: `${[
        `**Quests will refresh in \`1\`h \`1\`m**`,
        "Completing all quests will reward you with a bonus!",
        "Additionally, a high `$vote` streak can also increase your reward",
      ].join("\n")}\n\n**Completion Progress**`,
      thumbnail: getEmojiURL(emojis.CHEST),
    })
    jest.spyOn(processor, "run").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expected],
        components: [],
      },
    })

    const output = (await questCmd.run(msg)) as RunResult<MessageOptions>

    expect(processor.run).toBeCalledWith("123123", msg)
    assertTitle(output, expected)
    assertDescription(output, expected)
    assertThumbnail(output, expected)
  })

  test("quest daily successfully", async () => {
    msg.content = `$quest daily`
    msg.author.id = "123123"

    const expected = composeEmbedMessage(msg, {
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

    const output = (await questCmd.run(msg)) as RunResult<MessageOptions>

    expect(processor.run).toBeCalledWith("123123", msg)
    assertTitle(output, expected)
    assertDescription(output, expected)
    assertThumbnail(output, expected)
  })

  test("guild not found", async () => {
    msg.guildId = null
    await expect(questCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })
})
