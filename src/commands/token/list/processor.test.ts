import * as processor from "./processor"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { getEmoji, msgColors } from "utils/common"
import { MessageEmbed } from "discord.js"
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
    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })

  test("guild tokens found", async () => {
    const res = {
      ok: true,
      data: [
        {
          id: "72f399b6-755b-41f1-8a49-6673a1e6fda5",
          token_id: "45",
          token_name: "FTM",
          token_symbol: "FTM",
          icon: "https://ftmscan.com/token/images/stabl33_32.png",
          status: 1,
          created_at: "2023-01-11T10:33:54.871164Z",
          updated_at: "2023-01-11T10:33:54.871164Z",
          coin_gecko_id: "FTM",
          service_fee: 0,
        },
      ],
    }
    const expected = {
      color: msgColors.PINK,
      title: `${getEmoji("TIP")} Tokens list`,
      fields: [
        {
          inline: true,
          name: "​",
          value: "<:ftm:967285237686108212> **FTM**",
        },
      ],
    } as unknown as MessageEmbed
    defi.getAllTipBotTokens = jest.fn().mockResolvedValueOnce(res)
    const output = await processor.handleTokenList()
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
