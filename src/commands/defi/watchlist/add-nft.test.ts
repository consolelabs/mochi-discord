import Discord, { MessageOptions } from "discord.js"
import { getSuccessEmbed, getErrorEmbed } from "utils/discordEmbed"
import defi from "adapters/defi"
import { mockClient } from "../../../../tests/mocks"
import { commands } from "commands"
import { CommandError } from "errors"
import { RunResult } from "types/common"

jest.mock("adapters/defi")
const commandKey = "watchlist"
const commandAction = "add-nft"

describe("watchlist add-nft", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist add-nft eth",
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

  test("add successfully", async () => {
    const symbol = "eth"
    const res = {
      ok: true,
      data: null,
    }
    defi.addNFTToWatchlist = jest.fn().mockResolvedValueOnce(res)

    const output = await command.run(msg)
    const expected = getSuccessEmbed({
      title: "Successfully set!",
      description: `${symbol} has been added successfully! To see your watchlist use \`$wl view\``,
    })

    expect(defi.addNFTToWatchlist).toHaveBeenCalled()
    expect(defi.addNFTToWatchlist).toHaveBeenCalledWith({
      user_id: userId,
      collection_symbol: symbol,
    })
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("empty suggestions", async () => {
    const symbol = "eth"
    const res = {
      ok: true,
      data: {
        suggestions: [],
      },
    }
    defi.addNFTToWatchlist = jest.fn().mockResolvedValueOnce(res)

    const output = await command.run(msg)
    const expected = getErrorEmbed({
      title: "Collection not found",
      description:
        "The collection is not supported yet. Please contact us for the support. Thank you!",
    })

    expect(defi.addNFTToWatchlist).toHaveBeenCalled()
    expect(defi.addNFTToWatchlist).toHaveBeenCalledWith({
      user_id: userId,
      collection_symbol: symbol,
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
      data: null,
      error: "error",
    }
    defi.addNFTToWatchlist = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.addNFTToWatchlist).toHaveBeenCalled()
      expect(e).toBeInstanceOf(CommandError)
    }
  })
})
