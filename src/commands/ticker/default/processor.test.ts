import config from "adapters/config"
import CacheManager from "cache/node-cache"
import Discord, { MessageOptions } from "discord.js"
import { RunResult } from "types/common"
import { getSuccessEmbed } from "ui/discord/embed"
import { mockClient } from "../../../../tests/mocks"
import { setDefaultTicker } from "./processor"

jest.mock("adapters/config")
describe("setDefaultTicker", () => {
  const userId = Discord.SnowflakeUtil.generate()
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  test("successful", async () => {
    const coinId = "fantom"
    const symbol = "ftm"
    const name = "Fantom Opera"
    const msg = Reflect.construct(Discord.Message, [
      mockClient,
      {
        content: "$ticker default ftm",
        author: {
          id: userId,
          username: "tester",
          discriminator: 1234,
        },
        id: Discord.SnowflakeUtil.generate(),
        guild_id: Discord.SnowflakeUtil.generate(),
        channel_id: Discord.SnowflakeUtil.generate(),
      },
      Reflect.construct(Discord.TextChannel, [
        guild,
        {
          client: mockClient,
          guild: guild,
          id: Discord.SnowflakeUtil.generate(),
        },
      ]),
    ])
    const setDefaultRes = {
      ok: true,
    }
    config.setGuildDefaultTicker = jest
      .fn()
      .mockResolvedValueOnce(setDefaultRes)
    CacheManager.findAndRemove = jest.fn()
    const expected = getSuccessEmbed({
      msg,
      description: `Next time your server members use \`$ticker\` with \`${symbol}\`, **${name}** will be the default selection.`,
    })
    const output = await setDefaultTicker(msg, coinId, symbol, name)
    output.messageOptions.embeds[0].timestamp = expected.timestamp
    expect(expected).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
    )
    expect(CacheManager.findAndRemove).toBeCalledTimes(2)
  })
})
