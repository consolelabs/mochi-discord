import * as processor from "./processor"
import Config from "adapters/config"
import Defi from "adapters/defi"
import { APIError } from "errors"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"
import { PREFIX } from "utils/constants"
import { assertDescription } from "../../../../tests/assertions/discord"
import { getErrorEmbed } from "ui/discord/embed"
jest.mock("adapters/defi")
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
    }
    Defi.getSupportedTokens = jest.fn().mockResolvedValueOnce([])
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    await expect(
      processor.handleTokenRemove("guildId", "authorId")
    ).rejects.toThrow(APIError)
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
    assertDescription(output, expectedEmbed as any)
  })

  test("Your server has no tokens", async () => {
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
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    jest
      .spyOn(SelectMenuUtil, "composeDiscordSelectionRow")
      .mockReturnValueOnce(null as any)
    jest
      .spyOn(ButtonUtil, "composeDiscordExitButton")
      .mockReturnValueOnce(null as any)
    await processor.handleTokenRemove("guildId", "authorId")
    expect(SelectMenuUtil.composeDiscordSelectionRow).toHaveBeenCalledTimes(1)
    expect(SelectMenuUtil.composeDiscordSelectionRow).toHaveBeenCalledWith({
      customId: "guild_tokens_selection",
      placeholder: "Make a selection",
      options: [
        {
          label: "Fantom (FTM)",
          value: "FTM",
        },
      ],
    })
    expect(ButtonUtil.composeDiscordExitButton).toHaveBeenCalledTimes(1)
  })
})
