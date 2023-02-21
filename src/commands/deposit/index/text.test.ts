import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiURL, emojis } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
jest.mock("adapters/defi")

describe("run", () => {
  let msg: Message
  const depositCmd = commands["deposit"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("run with proper args", async () => {
    msg.content = `$deposit ftm`
    const embed = composeEmbedMessage(null, {
      author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
      description: `${msg.author.id}, your deposit address has been sent to you. Check your DM!`,
    })
    jest.spyOn(processor, "deposit").mockResolvedValueOnce({
      messageOptions: {
        embeds: [embed],
        components: [composeButtonLink("See the DM", "")],
      },
    } as any)
    const output = await depositCmd.run(msg)
    expect(processor.deposit).toHaveBeenCalledWith(msg, "ftm")
    assertRunResult(output as any, {
      messageOptions: {
        embeds: [embed],
        components: [composeButtonLink("See the DM", "")],
      },
    })
  })
})
