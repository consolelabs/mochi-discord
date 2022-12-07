import config from "adapters/config"
import { CommandInteraction, Message } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import TwitterStream from "utils/TwitterStream"

export async function handlePoeTwitterRemove(
  msg: Message | CommandInteraction,
  guildId: string
) {
  const twitterConfig = await config.getTwitterConfig(guildId)

  if (twitterConfig.ok) {
    await config.removeTwitterConfig(guildId)

    await TwitterStream.removeRule({
      channelId: twitterConfig.data.channel_id,
      ruleId: twitterConfig.data.rule_id,
    })
    if (msg instanceof Message) {
      msg.react(getEmoji("approve")).catch(() => msg.react("✅"))
    } else {
      // cannot react to interaction => send embed instead
      return {
        messageOptions: {
          embeds: [
            getSuccessEmbed({
              title: "PoE configuration removed.",
              description:
                "Successfully removed your server's Twitter PoE configs",
            }),
          ],
        },
      }
    }
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

const command: Command = {
  id: "poe_twitter_remove",
  command: "remove",
  brief: "Remove a server's Twitter PoE configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    return await handlePoeTwitterRemove(msg, msg.guildId)
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
