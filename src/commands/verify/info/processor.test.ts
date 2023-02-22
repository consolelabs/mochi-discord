import { Message } from "discord.js"
import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import mockdc from "../../../../tests/mocks/discord"
import community from "adapters/community"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
jest.mock("adapters/community")

describe("runVerify", () => {
  let msg: Message

  beforeEach(() => (msg = mockdc.cloneMessage()))

  afterEach(() => jest.clearAllMocks())

  test("runVerify successfully", async () => {
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: {
        verify_channel_id: "123123",
        role_id: "12121212",
      },
    } as any)
    const output = await processor.runVerify(msg, "123456")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Verify", getEmojiURL(emojis.APPROVE)],
            description: `Verify channel: <#123123>`,
            footer: ["To change verify channel and role, use $verify remove"],
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })

  test("runVerify api empty", async () => {
    jest.spyOn(community, "getVerifyWalletChannel").mockResolvedValueOnce({
      ok: true,
      data: null,
    } as any)
    const output = await processor.runVerify(msg, "123456")
    const expected = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "No verified channel found",
            author: ["Verify", getEmojiURL(emojis.APPROVE)],
            description: `You haven't set a channel for verification.\n${getEmoji(
              "pointingright"
            )} To set a new one, run \`verify set #<channel> @<verified role>\`.\n${getEmoji(
              "pointingright"
            )} Then re-check your configuration using \`verify info.\``,
          }),
        ],
      },
    }
    assertRunResult(output, expected)
  })
})
