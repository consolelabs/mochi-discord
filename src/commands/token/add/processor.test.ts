import { Guild, Message, SnowflakeUtil, TextChannel } from "discord.js"
import * as processor from "./processor"
import Config from "adapters/config"
import { mockClient } from "../../../../tests/mocks"
import Defi from "adapters/defi"
import { APIError, InternalError } from "errors"
import { Token } from "types/defi"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"
jest.mock("adapters/defi")
jest.mock("adapters/config")
jest.mock("ui/discord/select-menu")
jest.mock("ui/discord/button")

describe("handleTokenAdd", () => {
  const guild = Reflect.construct(Guild, [mockClient, {}])
  const userId = SnowflakeUtil.generate()
  const msg = Reflect.construct(Message, [
    mockClient,
    {
      content: "$token add",
      author: {
        id: userId,
        username: "tester",
        discriminator: 1234,
      },
      id: SnowflakeUtil.generate(),
    },
    Reflect.construct(TextChannel, [
      guild,
      {
        client: mockClient,
        guild: guild,
        id: SnowflakeUtil.generate(),
      },
    ]),
  ]) as Message
  // const interaction = {
  //   user: {
  //     id: SnowflakeUtil.generate(),
  //     send: jest.fn().mockResolvedValueOnce(dmMessage),
  //   },
  // } as unknown as CommandInteraction

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
      APIError
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
      InternalError
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
    Defi.getSupportedTokens = jest.fn().mockResolvedValueOnce(tokens)
    Config.getGuildTokens = jest.fn().mockResolvedValueOnce(getGuildTokensRes)
    jest
      .spyOn(SelectMenuUtil, "composeDiscordSelectionRow")
      .mockReturnValueOnce([
        {
          label: "Fantom (FTM)",
          value: "FTM",
        },
      ] as any)
    jest
      .spyOn(ButtonUtil, "composeDiscordExitButton")
      .mockReturnValueOnce(undefined as any)
    await processor.handleTokenAdd(msg, "test", "test")
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
