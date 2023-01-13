import Discord, { MessageOptions } from "discord.js"
import { getSuccessEmbed } from "ui/discord/embed"
import defi from "adapters/defi"
import { mockClient } from "../../../../tests/mocks"
import { InternalError } from "errors"
import { commands } from "commands"
import { RunResult } from "types/common"
import CacheManager from "cache/node-cache"
import { defaultEmojis } from "utils/common"

jest.mock("adapters/defi")
jest.mock("cache/node-cache")
const commandKey = "watchlist"
const commandAction = "remove-nft"

describe("watchlist remove nft", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist remove-nft eth",
      author: {
        id: userId,
        username: "tester",
        discriminator: 1234,
      },
      id: Discord.SnowflakeUtil.generate(),
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

  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const command = commands[commandKey].actions[commandAction]

  test("remove successfully", async () => {
    const symbol = "eth"
    const res = {
      ok: true,
      error: null,
    }
    defi.removeNFTFromWatchlist = jest.fn().mockResolvedValueOnce(res)
    CacheManager.findAndRemove = jest.fn().mockResolvedValue(null)

    const output = await command.run(msg)
    const expected = getSuccessEmbed({
      title: "Successfully remove!",
      description: `**${symbol}** has been removed from your watchlist successfully!\n${defaultEmojis.POINT_RIGHT} You can add the new one by \`$watchlist add-nft <symbol>\`!`,
    })

    expect(defi.removeNFTFromWatchlist).toHaveBeenCalled()
    expect(defi.removeNFTFromWatchlist).toHaveBeenCalledWith({
      userId,
      symbol,
    })
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("fail", async () => {
    const res = {
      ok: false,
      error: "error",
    }
    defi.removeNFTFromWatchlist = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.removeNFTFromWatchlist).toHaveBeenCalled()
      expect(e).toBeInstanceOf(InternalError)
    }
  })
})
