import * as processor from "./processor"
import Config from "adapters/config"
import { APIError } from "errors"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"
import { PREFIX } from "utils/constants"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
jest.mock("adapters/config")
jest.mock("ui/discord/select-menu")
jest.mock("ui/discord/button")

describe("handleTokenRemove", () => {
  beforeEach(() => jest.clearAllMocks())

  test("API Error when call getGuildTokens", async () => {
    const getGuildTokensRes = {
      data: [],
      ok: false,
      curl: "",
      log: "",
      status: 500,
      error: "",
    }
    const { curl, log, status, error } = getGuildTokensRes
    // Defi.getSupportedTokens = jest.fn().mockResolvedValueOnce([])
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    await expect(
      processor.handleTokenRemove("guildId", "authorId"),
    ).rejects.toThrow(new APIError({ curl, description: log, status, error }))
  })

  test("Your server has no tokens", async () => {
    const getGuildTokensRes = {
      data: [],
      ok: true,
      curl: "",
      log: "",
    }
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    const expectedEmbed = getErrorEmbed({
      description: `Your server has no tokens.\nUse \`${PREFIX}token add\` to add one to your server.`,
    })
    const output = await processor.handleTokenRemove("guildId", "authorId")
    assertRunResult(output, { messageOptions: { embeds: [expectedEmbed] } })
  })

  test("Successfully show remove token selection box", async () => {
    const getGuildTokensRes = {
      data: [
        {
          id: 1,
          address: "",
          symbol: "FTM",
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
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Need action",
            description:
              "Select to remove one of the following tokens from your server.",
          }),
        ],
        components: [null, null],
      },
      interactionOptions: {
        handler: processor.handler,
      },
    }
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    jest
      .spyOn(SelectMenuUtil, "composeDiscordSelectionRow")
      .mockReturnValueOnce(null as any)
    jest
      .spyOn(ButtonUtil, "composeDiscordExitButton")
      .mockReturnValueOnce(null as any)
    const output = await processor.handleTokenRemove("guildId", "authorId")
    assertRunResult(output, expected as any)
  })
})
