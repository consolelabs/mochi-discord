import { Message } from "discord.js"
import { ADMIN_HELP_CMD, HELP_CMD } from "../env"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { originalCommands } from "../commands"
import { emojis, getEmbedFooter, getHelpEmbed, thumbnails } from "utils/discord"
import guildConfig from "../modules/guildConfig"
import { Category, Command } from "types/common"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Admin: emojis.NEKO_COOL,
  Profile: emojis.PROFILE,
  Config: emojis.NEKO_COOL,
  Defi: emojis.SOCIAL,
  Community: emojis.GAMES,
}

export async function adminHelpMessage(msg: Message) {
  let embedMsg = getHelpEmbed("Admin Commands")
    .setThumbnail(thumbnails.HELP)
    .setDescription(
      `\nType \`${ADMIN_HELP_CMD} <command>\` to learn more about a command e,g \`${ADMIN_HELP_CMD} profile\``
    )
    .setFooter(getEmbedFooter([`Type ${HELP_CMD} for normal commands`]))
    .setTimestamp()

  let idx = 0
  for (let [category, emojiId] of Object.entries(categoryIcons)) {
    // const [category, emojiId] = Object.entries(categoryIcons)[i]
    if (category !== "Admin") continue
    const commandsOfThisCat = Object.values(originalCommands)
      .filter(Boolean)
      .filter((c) => c.category === category || c.id === "profile")
      .map((c) => `[\`${c.id}\`](https://pod.town)`)
      .join(" ")
    if (commandsOfThisCat.trim() === "") continue
    const emoji = msg.client.emojis.cache.get(emojiId)
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
    let embedMsg = getHelpEmbed("Standard Commands")
      .setThumbnail(thumbnails.HELP)
      .setDescription(
        `\nType \`${HELP_CMD} <command>\` to learn more about a command e,g \`${HELP_CMD} invite\`\n\n`
      )
      .setFooter(getEmbedFooter([`Type ${ADMIN_HELP_CMD} for admin commands`]))
      .setTimestamp()

    const categories = Object.entries(categoryIcons).sort((catA, catB) => {
      const commandsOfThisCatA = Object.values(originalCommands)
        .filter(Boolean)
        .filter((c) => c.category === catA[0]).length
      const commandsOfThisCatB = Object.values(originalCommands)
        .filter(Boolean)
        .filter((c) => c.category === catB[0]).length

      return commandsOfThisCatB - commandsOfThisCatA
    })

    let idx = 0
    for (let [category, emojiId] of categories) {
      if (category === "Admin") continue

      if (!(await guildConfig.categoryIsScoped(msg.guildId, category))) continue

      // filter scoped commands
      const scopedCommands = await Promise.all(
        Object.values(originalCommands).map(async (c) => {
          if (
            await guildConfig.commandIsScoped(
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
        .map((c) => `[\`${c.id}\`](https://pod.town)`)
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
