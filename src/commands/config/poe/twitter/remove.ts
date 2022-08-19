import config from "adapters/config"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import TwitterStream from "utils/TwitterStream"

const command: Command = {
  id: "poe_twitter_remove",
  command: "remove",
  brief: "Remove a guild's twitter PoE config",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const twitterConfig = await config.getTwitterConfig(msg.guildId)

    if (twitterConfig.ok) {
      await config.removeTwitterConfig(msg.guildId)

      await TwitterStream.removeRule({
        channelId: twitterConfig.data.channel_id,
        ruleId: twitterConfig.data.rule_id,
      })

      msg.react(getEmoji("approve")).catch(() => msg.react("✅"))
    } else {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "We couldn't find your server's twitter config",
            }),
          ],
        },
      }
    }

    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter remove`,
        examples: `${PREFIX}poe twitter remove`,
        title: "Remove config",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
