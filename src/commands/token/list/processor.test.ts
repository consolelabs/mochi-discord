import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { emojis, getEmoji, getEmojiURL, msgColors } from "utils/common"
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
        "ANIMATED_POINTING_RIGHT",
        true,
      )} To add more token to the list, use \`$token add\``,
      color: msgColors.SUCCESS,
    })
    defi.getUserSupportTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(
      { messageOptions: { embeds: [output.embed] } },
      { messageOptions: { embeds: [expected] } },
    )
  })

  test("guild tokens found", async () => {
    const res = {
      ok: true,
      data: {
        data: [
          {
            id: 1,
            address: "",
            symbol: "SOL",
            chain_id: 999,
            decimal: 9,
            discord_bot_supported: true,
            coin_gecko_id: "solana",
            name: "Solana",
            guild_default: false,
            is_native: true,
            chain: {
              id: 999,
              name: "Solana",
              short_name: "sol",
              coin_gecko_id: "solana",
              currency: "SOL",
            },
          },
        ],
      },
    }
    const expected = composeEmbedMessage(null, {
      thumbnail: getEmojiURL(emojis.TOKEN_LIST),
      author: ["Token List", getEmojiURL(emojis.PAWCOIN)],
      description: "1 . Solana `SOL`",
      color: msgColors.ACTIVITY,
      footer: [`Page 1/1`],
    })
    defi.getUserSupportTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(
      { messageOptions: { embeds: [output.embed] } },
      { messageOptions: { embeds: [expected] } },
    )
  })
})
