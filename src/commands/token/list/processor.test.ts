import * as processor from "./processor"
import Config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { getEmoji, msgColors } from "utils/common"
import { APIError } from "errors"
import { MessageEmbed } from "discord.js"
jest.mock("adapters/config")

describe("handleTokenList", () => {
  beforeEach(() => jest.clearAllMocks())

  test("API Error when call getGuildTokens", async () => {
    const getGuildTokensRes = {
      data: [],
      ok: false,
      curl: "",
      log: "",
    }
    const { curl, log } = getGuildTokensRes
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    await expect(processor.handleTokenList("guildId")).rejects.toThrow(
      new APIError({ curl, description: log })
    )
  })

  test("No tokens found", async () => {
    const getGuildTokensRes = {
      data: [],
      ok: true,
      curl: "",
      log: "",
    }
    const expected = composeEmbedMessage(null, {
      title: "No token found",
      description: `${getEmoji(
        "POINTINGRIGHT"
      )} To add more token to the list, use \`$token add\``,
      color: msgColors.SUCCESS,
    })
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    const output = await processor.handleTokenList("guildId")
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })

  test("guild tokens found", async () => {
    const getGuildTokensRes = {
      data: [
        {
          id: 1,
          address: "",
          symbol: "ftm",
          chain_id: 1,
          decimal: 10,
          discord_bot_supported: true,
          coin_gecko_id: "ftm",
          name: "Fantom",
        },
      ],
      ok: true,
      curl: "",
      log: "",
    }
    const expected = {
      color: "#FCD3C1",
      title: `${getEmoji("TIP")} Tokens list`,
      fields: [
        {
          inline: true,
          name: "​",
          value: "<:ftm:967285237686108212> **FTM**",
        },
      ],
    } as unknown as MessageEmbed
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    const output = await processor.handleTokenList("guildId")
    assertRunResult(output, { messageOptions: { embeds: [expected] } })
  })
})
