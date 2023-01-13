import Discord, { MessageOptions } from "discord.js"
import { composeEmbedMessage } from "discord/embed/ui"
import defi from "adapters/defi"
import { mockClient } from "../../../../tests/mocks"
import { defaultEmojis } from "utils/common"
import { RunResult } from "types/common"
import { commands } from "commands"
import { InternalError } from "errors"

jest.mock("adapters/defi")
const commandKey = "watchlist"
const commandAction = "add"

describe("watchlist add", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist add eth",
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
      data: {
        base_suggestions: [{}],
        target_suggestions: "",
        symbol: "eth",
      },
      error: null,
    }
    defi.addToWatchlist = jest.fn().mockResolvedValueOnce(res)

    const output = await command.run(msg)
    const expected = composeEmbedMessage(msg, {
      title: `${defaultEmojis.MAG} Multiple options found`,
      description: `Multiple tokens found for \`${res.data.symbol}\`.\nPlease select one of the following`,
    })

    expect(defi.addToWatchlist).toHaveBeenCalled()
    expect(defi.addToWatchlist).toHaveBeenCalledWith({
      user_id: userId,
      coin_gecko_id: "",
      is_fiat: false,
      symbol: res.data.symbol,
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
    defi.addToWatchlist = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(defi.addToWatchlist).toHaveBeenCalled()
      expect(e).toBeInstanceOf(InternalError)
    }
  })
})
