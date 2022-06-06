import { logger } from "logger"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message, TextChannel } from "discord.js"
import config from "adapters/config"
import { catchEm } from "utils/common"

const command: Command = {
  id: "reactionrole_list",
  command: "list",
  brief: "List all active reaction role configurations",
  category: "Config",
  run: async (msg: Message) => {
    try {
      let description = ""
      const rrList = await config.listAllReactionRoles(msg.guild.id)
      const channelList = msg.guild.channels.cache
        .filter((c) => c.type === "GUILD_TEXT")
        .map((c) => c as TextChannel)

      if (rrList.success) {
        const values = await Promise.all(
          rrList.configs.map(async (conf: any) => {
            const promiseArr = channelList.map((chan) =>
              catchEm(chan.messages.fetch(conf.message_id))
            )
            for (const prom of promiseArr) {
              const [err, fetchedMsg] = await prom
              if (!err && conf.roles?.length > 0) {
                const des =
                  `\n[<#${fetchedMsg.channelId}>](${fetchedMsg.url}) (${conf.message_id})\n` +
                  conf.roles
                    .map(
                      (role: any) =>
                        `+ Reaction ${role.reaction} for role <@&${role.id}>`
                    )
                    .join("\n")
                return des
              }
            }
          })
        )

        const data = values.join("").trim()
        description = data.length
          ? data
          : "No reaction role configurations found"
      } else {
        description = "Failed to get reaction role configurations"
      }

      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              description,
              title: "Reaction Roles",
            }),
          ],
        },
      }
    } catch (err) {
      logger.error(err as string)
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}rr list`,
          examples: `${PREFIX}rr list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
}

export default command
