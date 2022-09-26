import { Command } from "types/common"
import { PREFIX, STARBOARD_GITBOOK } from "utils/constants"
import {
  composeEmbedMessage,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { GuildIdNotFoundError } from "errors"
import { Message } from "discord.js"
import config from "adapters/config"
import { paginate } from "utils/common"

const command: Command = {
  id: "starboard_list",
  command: "list",
  brief: "List all active starboard configurations",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const guild = msg.guild
    let fields: any[] = []
    const res = await config.listAllRepostReactionConfigs(msg.guild.id)
    if (res?.data?.length > 0) {
      const { data } = res
      fields = data.map((conf: any) => ({
        quantity: conf.quantity,
        emoji: conf.emoji,
        channel: `<#${conf.repost_channel_id}>`,
      }))
      fields = paginate(fields, 5)
      fields = fields.map((batch: any[], idx: number) => {
        let quantityVal = ""
        let emojiVal = ""
        let channelVal = ""
        const embed = composeEmbedMessage(msg, {
          title: "Starboard Configuration",
          withoutFooter: true,
          thumbnail: guild.iconURL(),
        }).setFooter(`Page ${idx + 1} / ${fields.length}`)

        batch.forEach((f: any) => {
          quantityVal = quantityVal + f.quantity + "\n"
          emojiVal = emojiVal + f.emoji + "\n"
          channelVal = channelVal + f.channel + "\n"
        })

        return embed.setFields([
          { name: "Emoji", value: emojiVal, inline: true },
          { name: "Quantity", value: quantityVal, inline: true },
          { name: "Repost channel", value: channelVal, inline: true },
        ])
      })

      const msgOpts = {
        messageOptions: {
          embeds: [fields[0]],
          components: getPaginationRow(0, fields.length),
        },
      }
      const reply = await msg.reply(msgOpts.messageOptions)
      listenForPaginateAction(
        reply,
        msg,
        async (_msg: Message, idx: number) => {
          return {
            messageOptions: {
              embeds: [fields[idx]],
              components: getPaginationRow(idx, fields.length),
            },
          }
        }
      )
    } else {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              title: "Starboard Configuration",
              description: "No configuration found.",
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
          usage: `${PREFIX}sb list`,
          examples: `${PREFIX}sb list`,
          document: STARBOARD_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
