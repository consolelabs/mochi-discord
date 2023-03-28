import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  msgColors,
  thumbnails,
} from "utils/common"
import defi from "adapters/defi"

jest.mock("adapters/defi")

describe("handleTokenList", () => {
  beforeEach(() => jest.clearAllMocks())

  test("No tokens found", async () => {
    const res = {
      ok: true,
      data: [],
    }
    const expected = composeEmbedMessage(null, {
      title: "No token found",
      description: `${getEmoji(
        "POINTINGRIGHT"
      )} To add more token to the list, use \`$token add\``,
      color: msgColors.SUCCESS,
    })
    defi.getUserSupportTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(
      { messageOptions: { embeds: [output.embed] } },
      { messageOptions: { embeds: [expected] } }
    )
  })

  test("guild tokens found", async () => {
    const res = {
      ok: true,
      data: {
        data: [
          {
            id: 1,
            user_discord_id: "490895538892439553",
            guild_id: "963716572080406548",
            channel_id: "967842617926770698",
            message_id: "1090129714867339356",
            token_name: "Ambire AdEx",
            symbol: "ADX",
            token_address: "0xade00c28244d5ce17d72e40330b1c318cd12b7c3",
            token_chain_id: 1,
            status: "approved",
          },
        ],
      },
    }
    const expected = composeEmbedMessage(null, {
      thumbnail: thumbnails.CUSTOM_TOKEN,
      author: ["Token List", getEmojiURL(emojis.PAWCOIN)],
      description: "1 . Ambire AdEx `ADX`",
      color: msgColors.ACTIVITY,
      footer: [`Page 1/1`],
    })
    defi.getUserSupportTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(
      { messageOptions: { embeds: [output.embed] } },
      { messageOptions: { embeds: [expected] } }
    )
  })
})
