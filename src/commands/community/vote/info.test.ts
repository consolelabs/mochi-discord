import Discord, { MessageOptions } from "discord.js"
import { commands } from "commands"
import { composeEmbedMessage } from "utils/discordEmbed"
import { mockClient } from "../../../../tests/mocks"
import config from "adapters/config"
import { PREFIX } from "utils/constants"
import { RunResult } from "types/common"

jest.mock("adapters/config")
const commandKey = "vote"
const actionKey = "info"

describe("vote info", () => {
  const guildId = Discord.SnowflakeUtil.generate()
  const channelId = Discord.SnowflakeUtil.generate()
  const guild = Reflect.construct(Discord.Guild, [mockClient, { id: guildId }])

  const userId = Discord.SnowflakeUtil.generate()
  const message = Reflect.construct(Discord.Message, [
    mockClient,
    {
      content: "$vote info",
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

  test("success - without config", async () => {
    const noConfigResponse = {
      ok: true,
      data: null,
      error: "error",
      log: "",
      curl: "",
    }
    config.getVoteChannel = jest.fn().mockResolvedValueOnce(noConfigResponse)
    const output = await command.run(message)
    const expected = composeEmbedMessage(message, {
      title: "Vote channel",
      description: `No voting channel configured for this guild.\nSet one with \`${PREFIX}vote set <channel>.\``,
    })
    expect(config.getVoteChannel).toHaveBeenCalled()
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })

  test("success - with config", async () => {
    const noConfigResponse = {
      ok: true,
      data: {
        id: "cd04f2b7-605a-41e0-825e-4aaa76d3429e",
        guild_id: guildId,
        channel_id: channelId,
      },
      error: "error",
      log: "",
      curl: "",
    }
    config.getVoteChannel = jest.fn().mockResolvedValueOnce(noConfigResponse)
    const output = await command.run(message)
    const expected = composeEmbedMessage(message, {
      title: "Vote channel",
      description: `<#${channelId}> is currently set.\nTo change channel, run \`${PREFIX}vote set <channel>.\``,
    })
    expect(config.getVoteChannel).toHaveBeenCalled()
    expect(expected.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(expected.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })
})
