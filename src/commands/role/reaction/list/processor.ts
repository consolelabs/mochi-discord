import {
  ReactionRoleListConfigGroup,
  ReactionRoleListPaginated,
} from "types/config"
import { CommandInteraction, Message, MessageEmbed } from "discord.js"
import config from "adapters/config"
import { APIError, InternalError } from "errors"
import {
  listenForPaginateAction,
  listenForPaginateInteraction,
} from "handlers/discord/button"
import { truncate } from "lodash"
import { getPaginationRow } from "ui/discord/button"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import {
  getEmoji,
  getEmojiURL,
  emojis,
  paginate,
  msgColors,
} from "utils/common"
import { SLASH_PREFIX } from "utils/constants"
import { ResponseRole, ResponseRoleReactionByMessage } from "types/api"
import { ReactionRoleListConfigItem } from "types/config"

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
      msgOrInteraction: msg,
      curl: res.curl,
      description: res.log,
    })
  }

  const data = res.data.configs
  const pages = await getPaginatedConfigs(data ?? [], msg)
  return { ...(await getEmbedPagination(pages, msg)) }
}

export const getEmbedPagination = async (
  pages: ReactionRoleListPaginated,
  msg: Message | CommandInteraction
) => {
  if (!pages.totalPage) {
    return {
      embeds: [
        composeEmbedMessage(null, {
          author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
          description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${SLASH_PREFIX}role reaction set <message_link> <emoji> <role>\`\`\``,
        }),
      ],
    }
  }
  if (msg.type === "DEFAULT") {
    const embedPages: MessageEmbed[] = []
    pages.items.forEach((arr: ReactionRoleListConfigGroup[], idx: number) => {
      const [infoColumn, jumpBtnColumn] = getDisplayInfoColumns(arr)
      embedPages.push(
        composeEmbedMessage(null, {
          author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
          description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
          footer: [`Page ${idx + 1} / ${pages.totalPage}`],
          color: msgColors.PINK,
        }).addFields(
          { name: "\u200B", value: infoColumn, inline: true },
          { name: "\u200B", value: jumpBtnColumn, inline: true }
        )
      )
    })
    if (!embedPages.length) {
      return {
        embeds: [
          composeEmbedMessage(null, {
            author: ["No reaction roles found", getEmojiURL(emojis.NEKOLOVE)],
            description: `You haven't set any reaction roles yet. To set a new one, run \`\`\`${SLASH_PREFIX}role reaction set <message_link> <emoji> <role>\`\`\``,
          }),
        ],
      }
    }
    const result = {
      embeds: [embedPages[0]],
      components: getPaginationRow(0, embedPages.length),
    }
    const reply = await msg.reply(result)
    listenForPaginateAction(reply, msg, async (_msg, idx) => {
      return {
        messageOptions: {
          embeds: [embedPages[idx]],
          components: getPaginationRow(idx, embedPages.length),
        },
      }
    })
    return result
  } else {
    const embedPages: MessageEmbed[] = []
    pages.items.forEach((arr: ReactionRoleListConfigGroup[], idx: number) => {
      const [infoColumn, jumpBtnColumn] = getDisplayInfoColumns(arr)
      embedPages.push(
        composeEmbedMessage(msg as CommandInteraction, {
          author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
          description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
          footer: [`Page ${idx + 1} / ${pages.totalPage}`],
          color: msgColors.PINK,
        }).addFields(
          { name: "\u200B", value: infoColumn, inline: true },
          { name: "\u200B", value: jumpBtnColumn, inline: true }
        )
      )
    })
    if (!embedPages.length) {
      return {
        embeds: [
          composeEmbedMessage(msg as CommandInteraction, {
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
      async (_interaction, idx) => {
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

export const getDisplayInfoColumns = (arr: ReactionRoleListConfigGroup[]) => {
  let infoColumn = ""
  let jumpColumn = ""
  arr.forEach((group: ReactionRoleListConfigGroup) => {
    let roleCount = 0
    infoColumn += `\n**${truncate(group.title, { length: 20 })}**\n`
    group.values.forEach((item: ReactionRoleListConfigItem) => {
      infoColumn += `${getEmoji("BLANK")}${getEmoji("REPLY")} ${item.emoji} ${
        item.role
      }\n`
      roleCount++
    })
    jumpColumn += `**[Jump](${group.url})**\n\n` + "\n".repeat(roleCount)
  })
  return [infoColumn, jumpColumn]
}

export const getPaginatedConfigs = async (
  data: ResponseRoleReactionByMessage[],
  msg: Message | CommandInteraction
): Promise<ReactionRoleListPaginated> => {
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
          msgOrInteraction: msg,
          description: "Message not found",
        })
      }
      // map config role by message_id
      if (cfg.roles?.length) {
        const title =
          reactMessage.content ||
          reactMessage.embeds?.[0]?.title ||
          reactMessage.embeds?.[0]?.description ||
          "Embed Message"

        const f: ReactionRoleListConfigItem[] = cfg.roles.map(
          (role: ResponseRole): ReactionRoleListConfigItem => ({
            role: `<@&${role.id}>`,
            emoji: role.reaction,
          })
        )
        return {
          url: reactMessage.url,
          title,
          values: f,
        } as ReactionRoleListConfigGroup
      }
    })
  )
  values = values.filter((v) => Boolean(v))
  const paginated: ReactionRoleListConfigGroup[][] = paginate(values, 5)
  const configMap = new Map<number, ReactionRoleListConfigGroup[]>()
  paginated.forEach((item, idx) => configMap.set(idx, item))
  const result: ReactionRoleListPaginated = {
    totalPage: paginated.length ?? 0,
    items: configMap,
  }
  return result
}
