import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import { Message, MessageEmbed, TextChannel } from "discord.js"
import config from "adapters/config"
import { catchEm, getEmoji, getFirstWords, paginate } from "utils/common"
import { APIError, GuildIdNotFoundError } from "errors"

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

    const channels = msg.guild.channels.cache
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
            const f = conf.roles.map((role: any) => ({
              role: `<@&${role.id}>`,
              emoji: role.reaction,
              url: fetchedMsg.url,
              title: fetchedMsg.content,
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
      return composeEmbedMessage(msg, {
        author: [`${msg.guild?.name}'s reaction roles`, msg.guild?.iconURL()],
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
            composeEmbedMessage(msg, {
              author: [
                `${msg.guild?.name}'s reaction roles`,
                msg.guild?.iconURL(),
              ],
              description: `No reaction roles found! To set a new one, run \`\`\`${PREFIX}rr set <message_id> <emoji> <role>\`\`\``,
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
