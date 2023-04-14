import { Message, SnowflakeUtil } from "discord.js"
import * as processor from "./processor"
import Config from "adapters/config"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { mockClient } from "../../../../tests/mocks"
import { getEmoji } from "utils/common"
import mockdc from "../../../../tests/mocks/discord"
jest.mock("adapters/config")

describe("handleTokenDefault", () => {
  const msg = mockdc.cloneMessage()

  beforeEach(() => jest.clearAllMocks())

  test("GuildId not found", async () => {
    const msgNoGuild = Reflect.construct(Message, [
      mockClient,
      {
        id: SnowflakeUtil.generate(),
      },
    ])
    const expected = getErrorEmbed({
      description: "This command must be run in a Guild",
    })
    const output = await processor.handleTokenDefault(msgNoGuild, "eth")
    assertRunResult(
      { messageOptions: output },
      { messageOptions: { embeds: [expected] } }
    )
  })

  test("error 404 on calling setDefaultToken", async () => {
    const symbol = "eth"
    Config.setDefaultToken = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    })
    const expected = {
      embeds: [
        getErrorEmbed({
          description: `\`${symbol}\` hasn't been supported.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} Please choose one in our supported \`$token list\`\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )}.`,
        }),
      ],
    }
    const output = await processor.handleTokenDefault(msg, "eth")
    assertRunResult({ messageOptions: output }, { messageOptions: expected })
  })

  test("token not supported", async () => {
    const symbol = "eth"
    const supportedChains = [{ currency: "FTM" }, { currency: "ETH" }]
    let description = " token not supported"
    description =
      description +
      `\nAll suppported chains by Mochi\n` +
      supportedChains
        .map((chain: { currency: string }) => {
          return `**${chain.currency}**`
        })
        .join("\n")
    const expected = {
      embeds: [getErrorEmbed({ description: description })],
    }
    Config.setDefaultToken = jest
      .fn()
      .mockRejectedValueOnce("Error: token not supported")
    Config.getAllChains = jest.fn().mockResolvedValueOnce(supportedChains)
    const output = await processor.handleTokenDefault(msg, symbol)
    assertRunResult({ messageOptions: output }, { messageOptions: expected })
  })

  test("Set default token success", async () => {
    const symbol = "eth"
    const expected = {
      embeds: [
        getSuccessEmbed({
          description: `Successfully set **${symbol.toUpperCase()}** as default token for server`,
        }),
      ],
    }
    Config.setDefaultToken = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
    const output = await processor.handleTokenDefault(msg, symbol)
    assertRunResult({ messageOptions: output }, { messageOptions: expected })
  })
})
