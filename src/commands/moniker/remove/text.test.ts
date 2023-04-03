import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RunResult } from "types/common"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertDescription,
  assertAuthor,
} from "../../../../tests/assertions/discord"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const commandKey = "moniker"
  const commandAction = "remove"
  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const monikerCmd = commands[commandKey].actions[commandAction]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("guild not found", async () => {
    msg.guildId = null
    await expect(monikerCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })

  test("remove moniker successfully", async () => {
    msg.content = `$moniker remove cafe`
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

    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>

    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
