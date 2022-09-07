import config from "adapters/config"
import { getErrorEmbed } from "utils/discordEmbed"
import TwitterStream from "utils/TwitterStream"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

export async function twitterRemove(interaction: CommandInteraction) {
  if (!interaction.guildId) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }
  const twitterConfig = await config.getTwitterConfig(interaction.guildId)

  if (twitterConfig.ok) {
    await config.removeTwitterConfig(interaction.guildId)

    await TwitterStream.removeRule({
      channelId: twitterConfig.data.channel_id,
      ruleId: twitterConfig.data.rule_id,
    })

    // TODO: react reply
    // msg.react(getEmoji("approve")).catch(() => msg.react("✅"))
  } else {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "We couldn't find your server's twitter config",
          }),
        ],
      },
    }
  }

  return null
}


export const remove = new SlashCommandSubcommandBuilder()
  .setName("remove")
  .setDescription("Remove a guild's twitter PoE config")
