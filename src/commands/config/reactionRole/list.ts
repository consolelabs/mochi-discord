import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed, renderPaginator } from "utils/discordEmbed"
import { Message, TextChannel } from "discord.js"
import config from "adapters/config"
import { catchEm, paginate } from "utils/common"

const command: Command = {
  id: "reactionrole_list",
  command: "list",
  brief: "List all active reaction role configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
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
      pages = pages.map((arr: any, idx: number) => {
        let roleValue = ""
        let emojiValue = ""
        let channelValue = ""
        const embed = composeEmbedMessage(msg, {
          title: "Reaction roles",
          withoutFooter: true,
          thumbnail: msg.guild.iconURL(),
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

      if (pages.length) {
        renderPaginator(msg, pages)
      } else {
        return {
          messageOptions: {
            embeds: [
              composeEmbedMessage(msg, {
                description: "No configuration found.",
                title: "Reaction roles",
                withoutFooter: true,
                thumbnail: msg.guild.iconURL(),
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
              msg,
              description: "Failed to get reaction role configurations",
            }),
          ],
        },
      }
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
