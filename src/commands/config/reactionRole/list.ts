import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { Message, MessageEmbed } from "discord.js"
import config from "adapters/config"
import { emojis, getEmoji, getEmojiURL, paginate } from "utils/common"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import truncate from "lodash/truncate"

const command: Command = {
  id: "reactionrole_list",
  command: "list",
  brief: "List all active reaction roles",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await config.listAllReactionRoles(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        message: msg,
        curl: res.curl,
        description: res.log,
      })
    }

    const data = res.data.configs
    if (!data) {
      throw new InternalError({ message: msg })
    }

    let values = await Promise.all(
      data.map(async (cfg) => {
        const channel = msg.guild?.channels.cache.get(cfg.channel_id ?? "") // user already has message in the channel => channel in cache
        if (!channel || !channel.isText()) return null

        const reactMessage = await channel.messages
          .fetch(cfg.message_id ?? "")
          .catch(() => null)
        if (!reactMessage) return null

        if (cfg.roles && cfg.roles.length > 0) {
          const title =
            reactMessage.content ||
            reactMessage.embeds?.[0]?.title ||
            reactMessage.embeds?.[0]?.description ||
            "Embed Message"

          const f = cfg.roles.map((role: any) => ({
            role: `<@&${role.id}>`,
            emoji: role.reaction,
            url: reactMessage.url,
            title,
          }))
          return f
        }
      })
    )
    values = values.filter((v) => Boolean(v))
    let pages = paginate(values, 5)

    pages = pages.map((arr: any, idx: number): MessageEmbed => {
      let col1 = ""
      let col2 = ""
      arr.forEach((group: any) => {
        let roleCount = 0
        col1 += `\n**${truncate(group[0].title, { length: 20 })}**\n`
        group.forEach((item: any) => {
          col1 += `${getEmoji("blank")}${getEmoji("reply")} ${item.emoji} ${
            item.role
          }\n`
          roleCount++
        })
        col2 += `**[Jump](${group[0].url})**\n\n` + "\n".repeat(roleCount)
      })
      return composeEmbedMessage(msg, {
        author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
        description: `Run \`$rr set <message_link> <emoji> <role>\` to add a reaction role.`,
        footer: [`Page ${idx + 1} / ${pages.length}`],
      }).addFields(
        { name: "Message, Emoji & Role", value: col1, inline: true },
        { name: "Action", value: col2, inline: true }
      )
    })

    if (!pages.length) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
              description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\``,
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
    listenForPaginateAction(reply, msg, async (_msg: Message, idx: number) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
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
