import config from "adapters/config"
import { TextChannel } from "discord.js"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import TwitterStream from "utils/TwitterStream"

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
    if (!chan) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Channel not found" })],
        },
      }
    } else if (!chan.isText()) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({ msg, description: "Channel must be text-based" }),
          ],
        },
      }
    }

    let triggerKeywords = args[4]?.split(",") ?? []
    triggerKeywords = triggerKeywords.map((t) => t.trim())

    if (triggerKeywords.length === 0 || triggerKeywords.some((t) => !t)) {
      return {
        messageOptions: {
          embeds: [getErrorEmbed({ msg, description: "Empty keyword list" })],
        },
      }
    }

    for (const trigger of triggerKeywords) {
      if (!trigger.startsWith("#") && !trigger.startsWith("@")) {
        return {
          messageOptions: {
            embeds: [
              getErrorEmbed({
                msg,
                description:
                  "Invalid keyword format, only hashtag (#) or mention (@) are supported",
              }),
            ],
          },
        }
      }
    }

    const ruleId = await TwitterStream.upsertRule({
      ruleValue: triggerKeywords,
      channelId: msg.channelId,
      guildId: msg.guildId,
    })

    await config.setTwitterConfig(msg.guildId, {
      hashtag: triggerKeywords.filter((k) => k.startsWith("#")),
      twitter_username: triggerKeywords.filter((k) => k.startsWith("@")),
      user_id: msg.author.id,
      channel_id: chan.id,
      rule_id: ruleId,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [msg.guild.name, msg.guild.iconURL()],
            description: `Set by: <@${msg.author.id}>\nCheck updates in <#${
              chan.id
            }>\nTags: ${triggerKeywords
              .filter((k) => k.startsWith("#"))
              .map((t: string) => `\`${t}\``)
              .join(", ")}\nMentions: ${triggerKeywords
              .filter((k) => k.startsWith("@"))
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
