import { commands } from "commands"
import { Message } from "discord.js"
import mockdc from "../../../../tests/mocks/discord"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmojiURL, emojis, msgColors } from "utils/common"
import * as button from "handlers/discord/button"

describe("run", () => {
  let msg: Message
  const tokenCmd = commands["token"]

  beforeEach(() => (msg = mockdc.cloneMessage()))

  test("command run with enough args", async () => {
    msg.content = "$token list"
    const embed = composeEmbedMessage(null, {
      thumbnail: getEmojiURL(emojis.TOKEN_LIST),
      author: ["Token List", getEmojiURL(emojis.PAWCOIN)],
      description: "Test",
      color: msgColors.ACTIVITY,
      footer: [`Page 1/1`],
    })
    const expected = {
      embed,
      totalPages: 1,
    }
    jest.spyOn(processor, "handleTokenList").mockResolvedValueOnce(expected)
    jest
      .spyOn(button, "listenForPaginateAction")
      .mockImplementationOnce(() => undefined)
    await tokenCmd?.actions?.["list"].run(msg)
    expect(processor.handleTokenList).toBeCalled()
  })
})
