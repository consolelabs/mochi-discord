import { userMention } from "@discordjs/builders"
import { commands } from "commands"
import { Message, MessageEmbed, MessageOptions } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { RunResult } from "types/common"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import {
  assertAuthor,
  assertDescription,
  assertThumbnail,
} from "../../../../tests/assertions/discord"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const tipCmd = commands["tip"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("guild not found", async () => {
    msg.guildId = null
    await expect(tipCmd.run(msg)).rejects.toThrow(GuildIdNotFoundError)
  })

  test("tip user successfully", async () => {
    const recipient = userMention("521591222826041344")
    msg.content = `$tip ${recipient} 1.5 cake`
    const expected = new MessageEmbed({
      author: { name: "Tips", icon_url: getEmojiURL(emojis.COIN) },
      thumbnail: { url: thumbnails.TIP },
      description: `${userMention(
        msg.author.id
      )} has sent ${recipient} 1.5 cake`,
    })
    jest.spyOn(processor, "handleTip").mockResolvedValueOnce({
      embeds: [expected],
    })
    const output = (await tipCmd.run(msg)) as RunResult<MessageOptions>
    assertAuthor(output, expected)
    assertThumbnail(output, expected)
    assertDescription(output, expected)
  })
})
