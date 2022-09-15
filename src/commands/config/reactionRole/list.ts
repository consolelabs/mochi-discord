import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { Message, MessageEmbed, TextChannel } from "discord.js"
import config from "adapters/config"
import { catchEm, paginate } from "utils/common"
import { APIError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "reactionrole_list",
  command: "list",
  brief: "List all active reaction role configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const rrListRes = await config.listAllReactionRoles(msg.guildId)
    const channelList = msg.guild.channels.cache
      .filter((c) => c.type === "GUILD_TEXT")
      .map((c) => c as TextChannel)

    if (rrListRes.ok) {
      const values = await Promise.all(
        rrListRes.data.configs.map(async (conf: any) => {
          const promiseArr = channelList.map((chan) =>
            catchEm(chan.messages.fetch(conf.message_id))
          )
          for (const prom of promiseArr) {
            const [err, fetchedMsg] = await prom
            if (!err && conf.roles?.length > 0) {
              const f = conf.roles.map((role: any) => ({
                role: `<@&${role.id}>`,
                emoji: role.reaction,
                channel: `[Jump](${fetchedMsg.url})`,
              }))
              return f
            }
          }
        })
      )

      let pages = paginate(values.flat(), 5)
      pages = pages.map((arr: any, idx: number): MessageEmbed => {
        let roleValue = ""
        let emojiValue = ""
        let channelValue = ""
        const embed = composeEmbedMessage(msg, {
          author: ["Reaction roles", msg.guild?.iconURL()],
          withoutFooter: true,
        }).setFooter(`Page ${idx + 1} / ${pages.length}`)

        arr.forEach((f: any) => {
          roleValue = roleValue + f.role + "\n"
          emojiValue = emojiValue + f.emoji + "\n"
          channelValue = channelValue + f.channel + "\n"
        })

        embed.setFields([
          { name: "Role", value: roleValue, inline: true },
          { name: "Emoji", value: emojiValue, inline: true },
          { name: "Message", value: channelValue, inline: true },
        ])

        return embed
      })

      if (!pages.length) {
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                description: "Your reactionrole list is empty.",
                author: ["Reaction roles", msg.guild.iconURL()],
                withoutFooter: true,
              }),
            ],
          },
        }
      }

      const msgOpts = {
        messageOptions: {
          embeds: [pages[0]],
          components: getPaginationRow(0, pages.length),
        },
      }
      const reply = await msg.reply(msgOpts.messageOptions)
      listenForPaginateAction(
        reply,
        msg,
        async (_msg: Message, idx: number) => {
          return {
            messageOptions: {
              embeds: [pages[idx]],
              components: getPaginationRow(idx, pages.length),
            },
          }
        }
      )
    } else {
      throw new APIError({ message: msg, description: rrListRes.log })
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
  colorType: "Server",
}

export default command
