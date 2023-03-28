import { CommandInteraction } from "discord.js"
import { slashCommands } from "commands"
import * as processor from "./processor"
import mockdc from "../../../../tests/mocks/discord"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { thumbnails, getEmojiURL, emojis, msgColors } from "utils/common"
import * as button from "handlers/discord/button"

describe("run", () => {
  let i: CommandInteraction
  const tokenCmd = slashCommands["token"]
  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("command run with enough args", async () => {
    i.options.getSubcommand = jest.fn().mockReturnValue("list")
    const embed = composeEmbedMessage(null, {
      thumbnail: thumbnails.CUSTOM_TOKEN,
      author: ["Token List", getEmojiURL(emojis.PAWCOIN)],
      description: "test",
      color: msgColors.ACTIVITY,
      footer: [`Page 1/1`],
    })
    const expected = {
      embed,
      totalPages: 1,
    }
    jest.spyOn(processor, "handleTokenList").mockResolvedValueOnce(expected)
    jest
      .spyOn(button, "listenForPaginateInteraction")
      .mockImplementationOnce(() => undefined)
    const output = await tokenCmd.run(i)
    expect(processor.handleTokenList).toBeCalled()
    assertRunResult(output as any, {
      messageOptions: { embeds: [embed], components: [] },
    })
  })
})
