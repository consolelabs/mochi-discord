import * as processor from "./processor"
import Config from "adapters/config"
import { composeEmbedMessage } from "ui/discord/embed"
import {
  assertAuthor,
  assertDescription,
} from "../../../../tests/assertions/discord"
import { getEmoji } from "utils/common"
import { APIError } from "errors"
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
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    await expect(processor.handleTokenList("guildId")).rejects.toThrow(APIError)
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
    })
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    const output = await processor.handleTokenList("guildId")
    assertDescription(output, expected)
    assertAuthor(output, expected)
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
      color: "#77b255",
      title: ":dollar: Tokens list",
      fields: [
        {
          inline: true,
          name: "",
          value: "<:ftm:967285237686108212> **FTM**",
        },
      ],
    }
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    const output = await processor.handleTokenList("guildId")
    assertAuthor(output, expected as any)
    expect(output?.messageOptions?.embeds?.[0].fields?.length).toEqual(1)
  })
})
