import { slashCommands } from "commands"
import { CommandInteraction } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeButtonLink } from "ui/discord/button"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiURL, emojis } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"

describe("run", () => {
  let i: CommandInteraction
  const depositCmd = slashCommands["deposit"]

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("run with proper args", async () => {
    i.options.getString = jest.fn().mockReturnValue("ftm")
    const expectedEmbed = composeEmbedMessage(null, {
      author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
      description: `${i.user.id}, your deposit address has been sent to you. Check your DM!`,
    })
    jest.spyOn(processor, "deposit").mockResolvedValueOnce({
      messageOptions: {
        embeds: [expectedEmbed],
        components: [composeButtonLink("See the DM", "")],
      },
    } as any)
    const output = await depositCmd.run(i)
    expect(processor.deposit).toHaveBeenCalledWith(i, "ftm")
    assertRunResult(output as any, {
      messageOptions: {
        embeds: [expectedEmbed],
        components: [composeButtonLink("See the DM", "")],
      },
    })
  })
})
