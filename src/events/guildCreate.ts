import { DiscordEvent } from "."
import Discord from "discord.js"
import config from "../adapters/config"
import webhook from "adapters/webhook"
import { logger } from "logger"
import { composeEmbedMessage } from "utils/discordEmbed"
import { wrapError } from "utils/wrapError"

const event: DiscordEvent<"guildCreate"> = {
  name: "guildCreate",
  once: false,
  execute: async (guild) => {
    logger.info(
      `Joined guild: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`
    )

    wrapError(null, async () => {
      await config.createGuild(guild.id, guild.name)
      await webhook.pushDiscordWebhook("guildCreate", {
        guild_id: guild.id,
      })
      introduceMochiToAdmin(guild)
    })
  },
}

export default event

async function introduceMochiToAdmin(guild: Discord.Guild) {
  if (guild.systemChannel) {
    guild.systemChannel.send({
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
