import { SlashCommand } from "types/common"
import { SLASH_PREFIX as PREFIX } from "utils/constants"
import {
  composeEmbedMessage2,
  getErrorEmbed,
  getPaginationRow,
  listenForPaginateInteraction,
} from "utils/discordEmbed"
import { CommandInteraction, MessageEmbed, TextChannel } from "discord.js"
import config from "adapters/config"
import { catchEm, getEmoji, getFirstWords, paginate } from "utils/common"
import { APIError } from "errors"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

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
        curl: res.curl,
        description: res.log,
      })
    }

    const channels = interaction.guild.channels.cache
      .filter((c) => c.type === "GUILD_TEXT")
      .map((c) => c as TextChannel)

    // TODO: refactor
    const values = await Promise.all(
      res.data.configs?.map(async (conf: any) => {
        const promiseArr = channels.map((chan) =>
          catchEm(chan.messages.fetch(conf.message_id))
        )
        for (const prom of promiseArr) {
          const [err, fetchedMsg] = await prom
          if (!err && conf.roles?.length > 0) {
            const title =
              fetchedMsg.content ||
              fetchedMsg.embeds?.[0]?.title ||
              fetchedMsg.embeds?.[0]?.description ||
              "Embed Message"
            const f = conf.roles.map((role: any) => ({
              role: `<@&${role.id}>`,
              emoji: role.reaction,
              url: fetchedMsg.url,
              title,
            }))
            return f
          }
        }
      }) ?? []
    )

    let pages = paginate(values.flat().filter(Boolean), 5)
    pages = pages.map((arr: any, idx: number): MessageEmbed => {
      const col1 = arr
        .map(
          (item: any) =>
            `**${getFirstWords(item.title, 3)}**\n${getEmoji(
              "blank"
            )}${getEmoji("reply")} ${item.emoji} ${item.role}`
        )
        .join("\n\n")

      const col2 = arr
        .map((item: any) => `**[Jump](${item.url})**`)
        .join("\n\n\n")
      return composeEmbedMessage2(interaction, {
        author: [
          `${interaction.guild?.name}'s reaction roles`,
          interaction.guild?.iconURL(),
        ],
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
              author: [
                `${interaction.guild?.name}'s reaction roles`,
                interaction.guild?.iconURL(),
              ],
              description: `No reaction roles found! To set a new one, run \`\`\`${PREFIX}reactionrole set <message_id> <emoji> <role>\`\`\``,
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
