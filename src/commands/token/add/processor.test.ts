import * as processor from "./processor"
import Config from "adapters/config"
import Defi from "adapters/defi"
import { APIError, InternalError } from "errors"
import { Token } from "types/defi"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"
import mockdc from "../../../../tests/mocks/discord"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { composeEmbedMessage } from "ui/discord/embed"
import { handler } from "../remove/processor"
jest.mock("adapters/defi")
jest.mock("adapters/config")
jest.mock("ui/discord/select-menu")
jest.mock("ui/discord/button")

describe("handleTokenAdd", () => {
  const msg = mockdc.cloneMessage()
  msg.content = "$token add"

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
    await expect(processor.handleTokenAdd(msg, "test", "test")).rejects.toThrow(
      new APIError({
        curl: getGuildTokensRes.curl,
        description: getGuildTokensRes.log,
      })
    )
  })

  test("Your server already had all supported tokens", async () => {
    const tokens: Token[] = [
      {
        id: 1,
        address: "",
        symbol: "",
        chain_id: 1,
        decimal: 10,
        discord_bot_supported: true,
        coin_gecko_id: "ftm",
        name: "FTM",
      },
    ]
    const getGuildTokensRes = {
      data: tokens,
      ok: true,
      curl: "",
      log: "",
    }
    Defi.getSupportedTokens = jest.fn().mockResolvedValueOnce(tokens)
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    await expect(processor.handleTokenAdd(msg, "test", "test")).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        description: "Your server already had all supported tokens.",
      })
    )
  })

  test("Success show selectbox", async () => {
    const tokens: Token[] = [
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
    ]
    const getGuildTokensRes = {
      data: [],
      ok: true,
      curl: "",
      log: "",
    }
    const expectedSelectionRow = [
      {
        label: "Fantom (FTM)",
        value: "FTM",
      },
    ]
    Defi.getSupportedTokens = jest.fn().mockResolvedValueOnce(tokens)
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    jest
      .spyOn(SelectMenuUtil, "composeDiscordSelectionRow")
      .mockReturnValueOnce(expectedSelectionRow as any)
    jest
      .spyOn(ButtonUtil, "composeDiscordExitButton")
      .mockReturnValueOnce(undefined as any)
    const expectedOutput = {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            title: "Need action",
            description:
              "Select to add one of the following tokens to your server.",
          }),
        ],
        components: [expectedSelectionRow, undefined],
      },
      interactionOptions: {
        handler,
      },
    }
    const output = (await processor.handleTokenAdd(
      msg,
      "test",
      msg.author.id
    )) as any
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
    expect(ButtonUtil.composeDiscordExitButton).toHaveBeenCalledWith(
      msg.author.id
    )
    assertRunResult(output, expectedOutput as any)
  })
})
