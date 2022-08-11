import config from "adapters/config"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import TwitterStream from "utils/TwitterStream"

const command: Command = {
  id: "poe_twitter_remove",
  command: "remove",
  brief: "Remove a guild's twitter PoE config",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const twitterConfig = await config.getTwitterConfig(msg.guildId)
    await config.removeTwitterConfig(msg.guildId)

    await TwitterStream.removeRule({
      channelId: twitterConfig.channel_id,
      ruleId: twitterConfig.rule_id,
    })

    msg.react(getEmoji("approve")).catch(() => msg.react("✅"))

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
