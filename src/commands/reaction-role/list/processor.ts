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
import {
  ResponseRole,
  ResponseRoleReactionByMessage,
} from "./../../../types/api"
import { ReactionRoleListConfigItem } from "types/common"

export const handleRoleList = async (msg: Message | CommandInteraction) => {
  if (!msg.guildId || !msg.guild) {
    return {
      embeds: [
        getErrorEmbed({
          title: "This command must be run in a guild",
          description:
            "User invoked a command that was likely in a DM because guild id can not be found",
        }),
      ],
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
  const pages = await getPaginatedConfigs(data ?? [], msg)
  return { ...(await getEmbedPagination(pages, msg)) }
}

export const getEmbedPagination = async (
  pages: ReactionRoleListConfigItem[][][],
  msg: Message | CommandInteraction
) => {
  if (!pages?.length) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
          description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${PREFIX}rr set <message_link> <emoji> <role>\`\`\``,
        }),
      ],
    }
  }
  if (msg.type === "DEFAULT") {
    const embedPages = pages.map(
      (arr: ReactionRoleListConfigItem[][], idx: number): MessageEmbed => {
        const [col1, col2] = getDisplayColumnText(arr)
        return composeEmbedMessage(msg, {
          author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
          description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
          footer: [`Page ${idx + 1} / ${pages.length}`],
        }).addFields(
          { name: "\u200B", value: col1, inline: true },
          { name: "\u200B", value: col2, inline: true }
        )
      }
    )
    if (!embedPages.length) {
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
      embeds: [embedPages[0]],
      components: getPaginationRow(0, embedPages.length),
    }
    const reply = await msg.reply(result)
    listenForPaginateAction(reply, msg, async (_msg: Message, idx: number) => {
      return {
        messageOptions: {
          embeds: [embedPages[idx]],
          components: getPaginationRow(idx, embedPages.length),
        },
      }
    })
    return result
  } else {
    const embedPages = pages.map(
      (arr: ReactionRoleListConfigItem[][], idx: number): MessageEmbed => {
        const [col1, col2] = getDisplayColumnText(arr)
        return composeEmbedMessage2(msg as CommandInteraction, {
          author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
          description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
          footer: [`Page ${idx + 1} / ${pages.length}`],
        }).addFields(
          { name: "\u200B", value: col1, inline: true },
          { name: "\u200B", value: col2, inline: true }
        )
      }
    )
    if (!embedPages.length) {
      return {
        embeds: [
          composeEmbedMessage2(msg as CommandInteraction, {
            author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
            description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
          }),
        ],
      }
    }
    const result = {
      embeds: [embedPages[0]],
      components: getPaginationRow(0, embedPages.length),
    }
    listenForPaginateInteraction(
      msg as CommandInteraction,
      async (_interaction: CommandInteraction, idx: number) => {
        return {
          messageOptions: {
            embeds: [embedPages[idx]],
            components: getPaginationRow(idx, embedPages.length),
          },
        }
      }
    )
    return result
  }
}

export const getDisplayColumnText = (arr: ReactionRoleListConfigItem[][]) => {
  let col1 = ""
  let col2 = ""
  arr.forEach((group: ReactionRoleListConfigItem[]) => {
    let roleCount = 0
    col1 += `\n**${truncate(group[0].title, { length: 20 })}**\n`
    group.forEach((item: ReactionRoleListConfigItem) => {
      col1 += `${getEmoji("blank")}${getEmoji("reply")} ${item.emoji} ${
        item.role
      }\n`
      roleCount++
    })
    col2 += `**[Jump](${group[0].url})**\n\n` + "\n".repeat(roleCount)
  })
  return [col1, col2]
}

export const getPaginatedConfigs = async (
  data: ResponseRoleReactionByMessage[],
  msg: Message | CommandInteraction
): Promise<ReactionRoleListConfigItem[][][]> => {
  let values = await Promise.all(
    data.map(async (cfg) => {
      const channel = msg.guild?.channels.cache.get(cfg.channel_id ?? "") // user already has message in the channel => channel in cache
      if (!channel || !channel.isText()) {
        return null
      }

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

        const f = cfg.roles.map((role: ResponseRole) => ({
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
  return paginate(values, 5)
}
