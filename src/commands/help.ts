import { Message, Permissions } from "discord.js"
import { HELP_CMD } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { adminCategories, originalCommands } from "../commands"
import { emojis, onlyRunInAdminGroup, thumbnails } from "utils/common"
import config from "../adapters/config"
import { Category, Command } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Profile: emojis.PROFILE,
  Config: emojis.PROFILE,
  Defi: emojis.DEFI,
  Community: emojis.DEFI,
}

function getHelpEmbed(msg: Message, isAdmin: boolean) {
  return composeEmbedMessage(msg, {
    title: `${isAdmin ? "Admin" : "Standard"} Commands`,
    thumbnail: thumbnails.HELP,
    description: `\nType \`${HELP_CMD} <command>\` to learn more about a command e,g \`${HELP_CMD} profile\``,
    footer: [`Type ${HELP_CMD} for normal commands`],
  })
}

const info = {
  id: "help",
  command: "help",
  category: "Profile",
  name: "Help Menu",
  run: async function (msg: Message) {
    const data = await this.getHelpMessage(msg)
    return data
  },
  getHelpMessage: async (msg: Message) => {
    const embedMsg = getHelpEmbed(msg, false)
    let categories = Object.entries(categoryIcons).sort((catA, catB) => {
      const commandsOfThisCatA = Object.values(originalCommands)
        .filter(Boolean)
        .filter((c) => c.category === catA[0]).length
      const commandsOfThisCatB = Object.values(originalCommands)
        .filter(Boolean)
        .filter((c) => c.category === catB[0]).length

      return commandsOfThisCatB - commandsOfThisCatA
    })
    if (
      !msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ||
      !(await onlyRunInAdminGroup(msg))
    ) {
      categories = categories.filter(
        (cat) => !adminCategories[cat[0] as Category]
      )
    }

    let idx = 0
    for (const [category, emojiId] of categories) {
      if (category === "Admin") continue

      if (!(await config.categoryIsScoped(msg.guildId, category))) continue

      // filter scoped commands
      const scopedCommands = await Promise.all(
        Object.values(originalCommands).map(async (c) => {
          if (
            await config.commandIsScoped(
              msg.guildId,
              c.category,
              c.command
            )
          )
            return c
          return null
        })
      )

      const commandsOfThisCat = Object.values(scopedCommands)
        .filter(Boolean)
        .filter((c) => c.category === category && !c.experimental)
        .map((c) => `[\`${c.id}\`](https://google.com)`)
        .join(" ")
      if (commandsOfThisCat.trim() === "") continue

      const isDefaultEmoji = emojiId.startsWith(":") && emojiId.endsWith(":")
      const emoji = isDefaultEmoji
        ? emojiId
        : msg.client.emojis.cache.get(emojiId)

      if (idx % 3 === 2) embedMsg.addField("\u200B", "\u200B", true)
      embedMsg.addField(
        `${emoji ? `${emoji} ` : ""}${category}`,
        `${commandsOfThisCat}`,
        true
      )
      idx++
    }
    const nrOfEmptyFields = 3 - (embedMsg.fields.length % 3)
    new Array(nrOfEmptyFields)
      .fill(0)
      .forEach(() => embedMsg.addField("\u200B", "\u200B", true))
    return { embeds: [embedMsg] }
  },
} as Command

const help = info.getHelpMessage

export { help }
