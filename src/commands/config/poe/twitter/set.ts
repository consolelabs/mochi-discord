import config from "adapters/config"
import { TextChannel } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "poe_twitter_set",
  command: "set",
  brief: "Set/overwrite a guild's twitter PoE config",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    const args = getCommandArguments(msg)
    const logChannelArg = args[3] ?? ""
    if (!logChannelArg.startsWith("<#") || !logChannelArg.endsWith(">")) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Invalid channel" })],
        },
      }
    }

    const logChannel = logChannelArg.substring(2, logChannelArg.length - 1)
    const chan: TextChannel = await msg.guild.channels
      .fetch(logChannel)
      .catch(() => undefined)
    if (!chan)
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Channel not found" })],
        },
      }

    let triggerHashtags = args[4]?.split(",") ?? []
    triggerHashtags = triggerHashtags.map((t) => t.trim())

    if (triggerHashtags.length === 0 || triggerHashtags.some((t) => !t)) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Empty hashtag" })],
        },
      }
    }

    for (const trigger of triggerHashtags) {
      if (trigger.startsWith("#")) {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                msg,
                description:
                  "Invalid character, maybe drop the (#) hashtag character?",
              }),
            ],
          },
        }
      }
    }

    triggerHashtags = triggerHashtags.map((ht) => `#${ht}`)

    await config.setTwitterConfig(msg.guildId, {
      hashtag: triggerHashtags,
      user_id: msg.author.id,
      channel_id: chan.id,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [msg.guild.name, msg.guild.iconURL()],
            description: `Set by: <@${msg.author.id}>\nWatching <#${
              chan.id
            }>\nFor tags: ${triggerHashtags
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
        usage: `${PREFIX}poe twitter set <channel> <a, b, c>`,
        examples: `${PREFIX}poe twitter set #tweets some,hash,tag`,
        title: "Set config",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
}

export default command
