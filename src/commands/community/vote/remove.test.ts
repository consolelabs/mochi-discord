import Discord, { MessageOptions } from "discord.js"
import { commands } from "commands"
import { getSuccessEmbed } from "utils/discordEmbed"
import { mockClient } from "../../../../tests/mocks"
import config from "adapters/config"
import { PREFIX } from "utils/constants"
import { RunResult } from "types/common"

jest.mock("adapters/config")
const commandKey = "vote"
const actionKey = "remove"

describe("vote remove", () => {
  const guildId = Discord.SnowflakeUtil.generate()
  const guild = Reflect.construct(Discord.Guild, [mockClient, { id: guildId }])

  const userId = Discord.SnowflakeUtil.generate()
  const message = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$vote remove",
      author: {
        id: userId,
        username: "Tester",
        discriminator: 1234,
      },
      guild_id: guildId,
      id: Discord.SnowflakeUtil.generate(),
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
  if (!commands[commandKey] || !commands[commandKey].actions) return
  const command = commands[commandKey].actions[actionKey]

  test("success", async () => {
    const noConfigResponse = {
      ok: true,
      data: null,
      error: "error",
      log: "",
      curl: "",
    }
    config.removeVoteChannel = jest.fn().mockResolvedValueOnce(noConfigResponse)

    const output = await command.run(message)
    const expected = getSuccessEmbed({
      title: "Successfully removed!",
      description: `No voting channel configured for this guild.\nSet one with \`${PREFIX}vote set <channel>.\``,
    })
    expect(config.removeVoteChannel).toHaveBeenCalled()
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })
})
