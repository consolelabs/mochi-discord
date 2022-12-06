import Discord, { MessageOptions } from "discord.js"
import { getSuccessEmbed } from "utils/discordEmbed"
import defi from "adapters/defi"
import { mockClient } from "../../../../tests/mocks"
import { InternalError } from "errors"
import { commands } from "commands"
import { RunResult } from "types/common"

jest.mock("adapters/defi")
const commandKey = "watchlist"
const commandAction = "remove"

describe("watchlist remove", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist remove eth",
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

  test("success", async () => {
    const res = {
      ok: true,
      data: {},
      error: null,
    }
    defi.removeFromWatchlist = jest.fn().mockResolvedValueOnce(res)

    const output = await command.run(msg)
    const expected = getSuccessEmbed({
      title: "Successfully remove!",
      description:
        "The token is deleted successfully! Add new one by `$wl add <symbol>`.",
    })

    expect(defi.removeFromWatchlist).toHaveBeenCalled()
    expect(defi.removeFromWatchlist).toHaveBeenCalledWith({
      userId,
      symbol: "eth",
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
    defi.removeFromWatchlist = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.removeFromWatchlist).toHaveBeenCalled()
      expect(e).toBeInstanceOf(InternalError)
    }
  })
})
