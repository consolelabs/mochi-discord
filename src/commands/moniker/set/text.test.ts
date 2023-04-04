import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RunResult } from "types/common"
import { emojis, getEmojiURL } from "utils/common"
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
  const commandAction = "set"
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

  test("set moniker successfully", async () => {
    msg.content = `$moniker set cafe 0.01 cake`
    const expected = new MessageEmbed({
      author: {
        name: "Moniker successfully set",
        iconURL: getEmojiURL(emojis.CHECK),
      },
      description: `Moniker: [\`coffee\`](${HOMEPAGE_URL}) is set as 0.01 CAKE\n\nUse \`${SLASH_PREFIX}tip users amount moniker\` to tip your friend with moniker\ne.g. \`${SLASH_PREFIX}tip @anna 1 cookie\`\nRelate commands: ${[
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
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })

  test("set moniker successfully 2", async () => {
    msg.content = `$moniker set banh mi 0.01 eth`
    const expected = new MessageEmbed({
      author: {
        name: "Moniker successfully set",
        iconURL: getEmojiURL(emojis.CHECK),
      },
      description: `Moniker: [\`banh mi\`](${HOMEPAGE_URL}) is set as 0.01 ETH\n\nUse \`${SLASH_PREFIX}tip users amount moniker\` to tip your friend with moniker\ne.g. \`${SLASH_PREFIX}tip @anna 1 cookie\`\nRelate commands: ${[
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
    const output = (await monikerCmd.run(msg)) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertDescription(output, expected)
  })
})
