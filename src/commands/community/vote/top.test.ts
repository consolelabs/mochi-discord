import Discord, { MessageOptions } from "discord.js"
import { commands } from "commands"
import { composeEmbedMessage } from "utils/discordEmbed"
import { mockClient } from "../../../../tests/mocks"
import config from "adapters/config"
import community from "adapters/community"
import { getEmoji } from "utils/common"
import { RunResult } from "types/common"

jest.mock("adapters/config")
jest.mock("adapters/community")
const commandKey = "vote"
const actionKey = "top"

describe("vote top", () => {
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
    return
    const ldboard = {
      ok: true,
      data: [
        {
          discord_id: "884189774989131816",
          streak_count: 95,
          total_count: 104,
          last_streak_date: "2022-10-12T10:06:00Z",
          created_at: "2022-09-11T22:13:08.843067Z",
          updated_at: "2022-10-12T10:06:59.350608Z",
        },
        {
          discord_id: "241988104565555200",
          streak_count: 32,
          total_count: 78,
          last_streak_date: "2022-10-12T07:22:00Z",
          created_at: "2022-09-19T03:32:44.141563Z",
          updated_at: "2022-10-12T07:22:31.397117Z",
        },
        {
          discord_id: "830381396270645288",
          streak_count: 25,
          total_count: 73,
          last_streak_date: "2022-10-12T11:23:00Z",
          created_at: "2022-09-15T12:38:53.612052Z",
          updated_at: "2022-10-12T11:23:59.421041Z",
        },
      ],
      error: "error",
      log: "",
      curl: "",
    }
    community.getVoteLeaderboard = jest.fn().mockResolvedValueOnce(ldboard)

    const output = await command.run(message)
    const embed = composeEmbedMessage(message, {
      title: `${getEmoji("cup")} ${message.guild.name}'s top 10 voters`,
      thumbnail:
        "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
      description: `\u200B\n\u200B\n\u200B`,
      image: "attachment://leaderboard.png",
    })
    expect(config.removeVoteChannel).toHaveBeenCalled()
    expect(embed.title).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
    )
    expect(embed.description).toStrictEqual(
      (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
        .description
    )
  })
})
