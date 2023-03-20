import { userMention } from "@discordjs/builders"
import { MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL, thumbnails } from "utils/common"
import tip from ".."
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
jest.mock("adapters/defi")

describe("run", () => {
  const msg = mockdc.cloneMessage()
  const tipCmd = tip.textCmd

  test("tip user successfully", async () => {
    const recipient = userMention("521591222826041344")
    msg.content = `$tip ${recipient} 1.5 cake`
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Tips", getEmojiURL(emojis.COIN)],
            thumbnail: thumbnails.TIP,
            description: `${msg.author} has sent ${recipient} 1.5 cake`,
          }),
        ],
      },
    }
    jest.spyOn(processor, "tip").mockResolvedValueOnce(expected)
    const output = (await tipCmd.run(msg)) as RunResult<MessageOptions>
    assertRunResult(output, expected)
  })
})
