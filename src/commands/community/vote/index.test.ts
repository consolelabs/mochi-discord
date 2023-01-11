// import Discord, { MessageOptions, User } from "discord.js"
// import { commands } from "commands"
// import { composeEmbedMessage } from "utils/discordEmbed"
// import { mockClient } from "../../../../tests/mocks"
// import config from "adapters/config"
// import { emojis, getEmoji, getEmojiURL } from "utils/common"
// import { buildProgressBar, buildStreakBar } from "."
// import community from "adapters/community"
// import { RunResult } from "types/common"

// jest.mock("adapters/config")
// jest.mock("adapters/community")
// const commandKey = "vote"

// const voteLimitCount = 4
// const formatter = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 2 })

// describe("vote", () => {
//   const guildId = Discord.SnowflakeUtil.generate()
//   const channelId = Discord.SnowflakeUtil.generate()
//   const guild = Reflect.construct(Discord.Guild, [mockClient, { id: guildId }])

//   const userId = Discord.SnowflakeUtil.generate()
//   const message = Reflect.construct(Discord.Message, [
//     mockClient,
//     {
//       content: "$vote",
//       author: {
//         id: userId,
//         username: "Tester",
//         discriminator: 1234,
//       },
//       guild_id: guildId,
//       id: Discord.SnowflakeUtil.generate(),
//       channel_id: Discord.SnowflakeUtil.generate(),
//     },
//     Reflect.construct(Discord.TextChannel, [
//       guild,
//       {
//         client: mockClient,
//         guild: guild,
//         id: Discord.SnowflakeUtil.generate(),
//       },
//     ]),
//   ])
//   if (!commands[commandKey]) return
//   const command = commands[commandKey]

//   test("success - no config", async () => {
//     const noConfigResponse = {
//       ok: true,
//       data: null,
//       error: "error",
//       log: "",
//       curl: "",
//     }

//     const upvoteStreakResponse = {
//       ok: true,
//       data: {
//         data: {
//           discord_id: userId,
//           minutes_until_reset: 0,
//           minutes_until_reset_topgg: 0,
//           minutes_until_reset_discordbotlist: 0,
//           streak_count: 0,
//           total_count: 2,
//           last_streak_time: "2022-09-21T03:22:00Z",
//         },
//       },
//       error: null,
//       log: "",
//       curl: "",
//     }

//     config.getVoteChannel = jest.fn().mockResolvedValueOnce(noConfigResponse)
//     community.getUpvoteStreak = jest
//       .fn()
//       .mockResolvedValueOnce(upvoteStreakResponse)

//     const output = await command.run(message)
//     const expected = await voteEmbed(
//       Reflect.construct(Discord.User, [
//         mockClient,
//         {
//           id: userId,
//           username: "Tester",
//           discriminator: 1234,
//         },
//       ])
//     )
//     expect(config.getVoteChannel).toHaveBeenCalled()
//     expect(expected.title).toStrictEqual(
//       (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
//     )
//     expect(expected.description).toStrictEqual(
//       (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
//         .description
//     )
//   })

//   test("success - with config", async () => {
//     const noConfigResponse = {
//       ok: true,
//       data: {
//         id: "cd04f2b7-605a-41e0-825e-4aaa76d3429e",
//         guild_id: guildId,
//         channel_id: channelId,
//       },
//       error: "error",
//       log: "",
//       curl: "",
//     }

//     config.getVoteChannel = jest.fn().mockResolvedValueOnce(noConfigResponse)

//     const output = await command.run(message)
//     const expected = composeEmbedMessage(message, {
//       author: ["Go to the vote channel", getEmojiURL(emojis.SOCIAL)],
//       description: `You can only vote in <#${channelId}>.`,
//     })

//     expect(config.getVoteChannel).toHaveBeenCalled()
//     expect(expected.title).toStrictEqual(
//       (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0].title
//     )
//     expect(expected.description).toStrictEqual(
//       (output as RunResult<MessageOptions>)?.messageOptions?.embeds?.[0]
//         .description
//     )
//   })
// })

// async function voteEmbed(user: User) {
//   const embed = composeEmbedMessage(null, {
//     title: "Call for Mochians!",
//     description:
//       "Every 12 hours, help vote Mochi Bot raise to the top.\nYou get rewards, Mochi is happy, it's a win-win.\n\u200b",
//     color: "#47ffc2",
//     originalMsgAuthor: user,
//     thumbnail:
//       "https://media.discordapp.net/attachments/984660970624409630/1016614817433395210/Pump_eet.png",
//   })
//   embed.setFields([
//     {
//       name: `${getEmoji("like")} Vote Available`,
//       value:
//         "[Click here to vote on top.gg](https://top.gg/bot/963123183131709480/vote)\n\u200b",
//       inline: true,
//     },
//     {
//       name: `${getEmoji("like")} Vote Available`,
//       value:
//         "[Click here to vote on discordbotlist.com](https://discordbotlist.com/bots/mochi-bot/upvote)\n\u200b",
//       inline: true,
//     },
//     {
//       name: `${getEmoji("exp")} Reward`,
//       value: `Every \`${formatter.format(
//         voteLimitCount
//       )}\` votes, \`+20\` to all factions exp\n\u200b`,
//       inline: true,
//     },
//     {
//       name: "Recurring Vote Progress",
//       value: `${buildProgressBar(
//         ((2 % voteLimitCount) / voteLimitCount) * voteLimitCount,
//         2.5
//       )} \`${formatter.format(2 % voteLimitCount)}/${formatter.format(
//         voteLimitCount
//       )}\``,
//       inline: false,
//     },
//     {
//       name: `${getEmoji("like")} Voting Streak Buff: \`Tier ${1}\``,
//       value: `${buildStreakBar(0)}`,
//       inline: false,
//     },
//   ])
//   return embed
// }
