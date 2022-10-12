import Discord from "discord.js"
import { mockClient } from "../../../../tests/mocks"
import { APIError } from "errors"
import { commands } from "commands"
import CacheManager from "utils/CacheManager"

jest.mock("adapters/defi")
jest.mock("utils/CacheManager")
const commandKey = "watchlist"
const commandAction = "view"

describe("watchlist view", () => {
  const guild = Reflect.construct(Discord.Guild, [mockClient, {}])
  const userId = Discord.SnowflakeUtil.generate()
  const msg = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$watchlist view",
      author: {
        id: userId,
        username: "tester",
        discriminator: 1234,
        avatar: "https://getmochi.co/favicon-32x32.png",
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
  ]) as Discord.Message

  if (
    !commands[commandKey] ||
    !commands[commandKey].actions ||
    !commands[commandKey].actions[commandAction]
  )
    return
  const command = commands[commandKey].actions[commandAction]

  test("empty data", async () => {
    const res = {
      ok: true,
      data: [],
    }

    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    msg.reply = async () => {
      return msg
    }

    await command.run(msg)

    expect(CacheManager.get).toHaveBeenCalled()
  })

  test("have data", async () => {
    const res = {
      ok: true,
      data: [
        {
          symbol: "eth",
          current_price: 0.1,
          sparkline_in_7d: {
            price: [0.1, 0.2],
          },
          price_change_percentage_7d_in_currency: 0.2,
          is_pair: true,
        },
      ],
    }

    CacheManager.get = jest.fn().mockResolvedValueOnce(res)
    msg.reply = async () => {
      return msg
    }

    await command.run(msg)

    expect(CacheManager.get).toHaveBeenCalled()
  })

  test("fail", async () => {
    const res = {
      ok: false,
      data: null,
    }

    CacheManager.get = jest.fn().mockResolvedValueOnce(res)

    try {
      await command.run(msg)
    } catch (e) {
      expect(CacheManager.get).toHaveBeenCalled()
      expect(e).toBeInstanceOf(APIError)
    }
  })
})
