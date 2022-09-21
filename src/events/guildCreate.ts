import { Event } from "."
import Discord from "discord.js"
import config from "../adapters/config"
import webhook from "adapters/webhook"
import { BotBaseError } from "errors"
import { logger } from "logger"
import ChannelLogger from "utils/ChannelLogger"
import { TextChannel } from "discord.js"
import { composeEmbedMessage } from "utils/discordEmbed"

export default {
  name: "guildCreate",
  once: false,
  execute: async (guild: Discord.Guild) => {
    logger.info(
      `Joined guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    )

    try {
      await config.createGuild(guild.id, guild.name)
      await webhook.pushDiscordWebhook("guildCreate", {
        guild_id: guild.id,
      })
      introduceMochiToAdmin(guild)
    } catch (e) {
      const error = e as BotBaseError
      if (error.handle) {
        error.handle()
      } else {
        logger.error(e as string)
      }
      ChannelLogger.log(error, 'Event<"guildCreate">')
    }
  },
} as Event<"guildCreate">

async function introduceMochiToAdmin(guild: Discord.Guild) {
  const introduceChannel = guild.channels.cache
    .filter((c) => c.type == "GUILD_TEXT")
    .map((c) => c as TextChannel)[0]

  if (introduceChannel) {
    introduceChannel.send({
      embeds: [
        composeEmbedMessage(null, {
          title: `Hi ${guild.name} administrators!!!`,
          description: `Thank you for using Mochi Bot to build your community! The first thing to do is type \`$help\` to explore all features or read our instructions on 
          Gitbook. To build an optimal community, our Mochi Bot offers these functions:
          \n• Config Good-morning channel: \`$gm\`
          • Config channel to track member activity: \`$log\`
          • Set up default and reaction role: \`$defaultrole\`, \`$reactionroles\`
          • Set up a welcome message: \`/welcome\`
          • Track server information: \`$stats\`
          • Update Tweet from Twitter: \`$poe\`
          \nOnly Administrators can use these commands. If you want others to use these commands, make them administrators. Run the command to build a community with Mochi now!!!
          `,
          color: `0xFCD3C1`,
        }),
        composeEmbedMessage(null, {
          description: `Greeting new members by \`/welcome set\` and \`/welcome message\`.`,
          image: `https://cdn.discordapp.com/attachments/701029345795375114/1022072432875548692/unknown.png`,
          color: `0xFCD3C1`,
        }),
        composeEmbedMessage(null, {
          description: `Config a good-morning channel to increase engagement by \`$gm config\``,
          image: `https://cdn.discordapp.com/attachments/701029345795375114/1022072477200945183/unknown.png`,
          color: `0xFCD3C1`,
        }),
      ],
    })
  }
}
