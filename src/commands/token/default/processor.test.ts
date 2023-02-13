import { Message, SnowflakeUtil } from "discord.js"
import * as processor from "./processor"
import Config from "adapters/config"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { assertDescription } from "../../../../tests/assertions/discord"
import { defaultEmojis } from "utils/common"
jest.mock("adapters/config")

describe("handleTokenDefault", () => {
  const msg = {
    id: SnowflakeUtil.generate(),
    guildId: SnowflakeUtil.generate(),
  } as Message
  // const interaction = {
  //   user: {
  //     id: SnowflakeUtil.generate(),
  //     send: jest.fn().mockResolvedValueOnce(dmMessage),
  //   },
  // } as unknown as CommandInteraction

  beforeEach(() => jest.clearAllMocks())

  test("GuildId not found", async () => {
    const msgNoGuild = {
      id: SnowflakeUtil.generate(),
    } as Message
    const expected = getErrorEmbed({
      description: "This command must be run in a Guild",
    })
    const output = await processor.handleTokenDefault(msgNoGuild, "eth")
    assertDescription({ messageOptions: output }, expected)
  })

  test("error 404 on calling setDefaultToken", async () => {
    const symbol = "eth"
    const expected = getErrorEmbed({
      description: `\`${symbol}\` hasn't been supported.\n${defaultEmojis.POINT_RIGHT} Please choose one in our supported \`$token list\`\n${defaultEmojis.POINT_RIGHT} To add your token, run \`$token add\`.`,
    })
    Config.setDefaultToken = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
    })
    const output = await processor.handleTokenDefault(msg, "eth")
    assertDescription({ messageOptions: output }, expected)
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
    const expected = getErrorEmbed({ description: description })
    Config.setDefaultToken = jest
      .fn()
      .mockRejectedValueOnce("Error: token not supported")
    Config.getAllChains = jest.fn().mockResolvedValueOnce(supportedChains)
    const output = await processor.handleTokenDefault(msg, symbol)
    assertDescription({ messageOptions: output }, expected)
  })

  test("Set default token success", async () => {
    const symbol = "eth"
    const expected = composeEmbedMessage(null, {
      description: `Successfully set **${symbol.toUpperCase()}** as default token for server`,
    })
    Config.setDefaultToken = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200 })
    const output = await processor.handleTokenDefault(msg, symbol)
    assertDescription({ messageOptions: output }, expected)
  })
})
