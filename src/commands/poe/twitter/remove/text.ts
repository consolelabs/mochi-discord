import config from "adapters/config"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "discord/embed/ui"
import TwitterStream from "../../../../twitter/listener"

const command: Command = {
  id: "poe_twitter_remove",
  command: "remove",
  brief: "Remove a server's Twitter PoE configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
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

    return null
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
