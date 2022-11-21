import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateInteraction,
} from "utils/discordEmbed"
import { CommandInteraction, MessageEmbed } from "discord.js"
import config from "adapters/config"
import { emojis, getEmoji, getEmojiURL, paginate } from "utils/common"
import { APIError, InternalError } from "errors"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import truncate from "lodash/truncate"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("List all active reaction roles")
  },
  run: async (interaction: CommandInteraction) => {
    if (!interaction.guildId || !interaction.guild) {
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

    const res = await config.listAllReactionRoles(interaction.guildId)
    if (!res.ok) {
      throw new APIError({
        message: interaction,
        curl: res.curl,
        description: res.log,
      })
    }

    const data = res.data.configs
    if (!data) {
      throw new InternalError({
        message: interaction,
        description: "No configuration found",
      })
    }

    let values = await Promise.all(
      data.map(async (cfg) => {
        const channel = interaction.guild?.channels.cache.get(
          cfg.channel_id ?? ""
        ) // user already has message in the channel => channel in cache
        if (!channel || !channel.isText()) return null

        const reactMessage = await channel.messages
          .fetch(cfg.message_id ?? "")
          .catch(() => null)
        if (!reactMessage) {
          throw new InternalError({
            message: interaction,
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
      return composeEmbedMessage2(interaction, {
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
            composeEmbedMessage2(interaction, {
              author: ["Reaction role list", getEmojiURL(emojis.NEKOLOVE)],
              description: `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.`,
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
    listenForPaginateInteraction(
      interaction,
      async (interaction: CommandInteraction, idx: number) => {
        return {
          messageOptions: {
            embeds: [pages[idx]],
            components: getPaginationRow(idx, pages.length),
          },
        }
      }
    )

    return msgOpts
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${PREFIX}reactionrole list`,
        examples: `${PREFIX}reactionrole list`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
