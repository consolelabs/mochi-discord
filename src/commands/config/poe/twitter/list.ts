import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import utc from "dayjs/plugin/utc"
import dayjs from "dayjs"
dayjs.extend(utc)

const command: Command = {
  id: "poe_twitter_list",
  command: "list",
  brief: "See your server's PoE config",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    const twitterConfig = await config.getTwitterConfig(msg.guildId)

    if (!twitterConfig || !twitterConfig.channel_id) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              author: [msg.guild.name, msg.guild.iconURL()],
              description: `No available config`,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [msg.guild.name, msg.guild.iconURL()],
            description: `Set by: <@${twitterConfig.user_id}> (${dayjs(
              twitterConfig.updated_at
            )
              .utc()
              .format("MMM DD YYYY HH:mm:ss UTC")})\nWatching <#${
              twitterConfig.channel_id
            }>\nFor tags: ${twitterConfig.hashtag
              .map((t: string) => `\`${t}\``)
              .join(", ")}`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter list`,
        examples: `${PREFIX}poe twitter list`,
        title: "Get config",
      }),
    ],
  }),
  colorType: "Server",
  canRunWithoutAction: true,
}

export default command
