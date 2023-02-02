import { ResponseRoleReactionByMessage } from "./../../../types/api"
import { CommandInteraction, Message, MessageEmbed } from "discord.js"
import config from "adapters/config"
import { APIError, InternalError } from "errors"
import {
  listenForPaginateAction,
  listenForPaginateInteraction,
} from "handlers/discord/button"
import { truncate } from "lodash"
import { getPaginationRow } from "ui/discord/button"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  getErrorEmbed,
} from "ui/discord/embed"
import { getEmoji, getEmojiURL, emojis, paginate } from "utils/common"
import { PREFIX } from "utils/constants"

export const handleRoleList = async (msg: Message | CommandInteraction) => {
  if (!msg.guildId || !msg.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            title: "This command must be run in a guild",
            description:
              "User invoked a command that was likely in a DM because guild id can not be found",
          }),
        ],
      },
    }
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
    throw new InternalError({
      message: msg,
      description: "No configuration found",
    })
  }

  const msgOpts = await transformEmbedPagination(data, msg)
  return msgOpts
}

export const transformEmbedPagination = async (
  data: ResponseRoleReactionByMessage[],
  msg: Message | CommandInteraction
) => {
  let values = await Promise.all(
    data.map(async (cfg) => {
      const channel = msg.guild?.channels.cache.get(cfg.channel_id ?? "") // user already has message in the channel => channel in cache
      if (!channel || !channel.isText()) return null

      const reactMessage = await channel.messages
        .fetch(cfg.message_id ?? "")
        .catch(() => null)

      if (!reactMessage) {
        throw new InternalError({
          message: msg,
          description: "Message not found",
        })
      }

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
  if (msg.type === "DEFAULT") {
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
        description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
        footer: [`Page ${idx + 1} / ${pages.length}`],
      }).addFields(
        { name: "\u200B", value: col1, inline: true },
        { name: "\u200B", value: col2, inline: true }
      )
    })
    if (!pages.length) {
      return {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
            description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\``,
          }),
        ],
      }
    }
    const result = {
      embeds: [pages[0]],
      components: getPaginationRow(0, pages.length),
    }
    const reply = await msg.reply(result)
    listenForPaginateAction(reply, msg, async (_msg: Message, idx: number) => {
      return {
        messageOptions: {
          embeds: [pages[idx]],
          components: getPaginationRow(idx, pages.length),
        },
      }
    })
    return result
  }
  if (msg.type === "APPLICATION_COMMAND") {
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
      return composeEmbedMessage2(msg as CommandInteraction, {
        author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
        description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
        footer: [`Page ${idx + 1} / ${pages.length}`],
      }).addFields(
        { name: "\u200B", value: col1, inline: true },
        { name: "\u200B", value: col2, inline: true }
      )
    })
    if (!pages.length) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(msg as CommandInteraction, {
              author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
              description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
            }),
          ],
        },
      }
    }
    const result = {
      embeds: [pages[0]],
      components: getPaginationRow(0, pages.length),
    }
    listenForPaginateInteraction(
      msg as CommandInteraction,
      async (_interaction: CommandInteraction, idx: number) => {
        return {
          messageOptions: {
            embeds: [pages[idx]],
            components: getPaginationRow(idx, pages.length),
          },
        }
      }
    )
    return result
  }
}
