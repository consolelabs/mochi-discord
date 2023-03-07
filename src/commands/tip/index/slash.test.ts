import { userMention } from "@discordjs/builders"
import { CommandInteraction, MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import tip from ".."

describe("run", () => {
  let i: CommandInteraction
  const tipCmd = tip.slashCmd

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))

  test("sucessfully", async () => {
    const recipient = userMention("521591222826041344")
    i.options.getString = jest
      .fn()
      .mockReturnValueOnce(recipient)
      .mockReturnValueOnce("cake")
      .mockReturnValueOnce("hpny")
    i.options.getNumber = jest.fn().mockReturnValueOnce(1.5)
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.TIP,
      author: ["Tips", getEmojiURL(emojis.COIN)],
      description: `${userMention(i.user.id)} has sent ${recipient} 1.5 cake`,
    })
    jest.spyOn(processor, "tip").mockResolvedValueOnce({
      messageOptions: { embeds: [expected] },
    })
    const output = (await tipCmd.run(i)) as RunResult<MessageOptions>
    const args = ["tip", "<@521591222826041344>", "1.5", "cake", `"hpny"`]
    expect(processor.tip).toBeCalledWith(i, args)
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
