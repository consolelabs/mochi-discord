import { Message } from "discord.js"
import { ADMIN_HELP_CMD, HELP_CMD } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { originalCommands } from "../commands"
import { emojis, thumbnails } from "utils/common"
import guildConfig from "../modules/guildConfig"
import { Category, Command } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Admin: emojis.PROFILE,
  Profile: emojis.PROFILE,
  Config: emojis.PROFILE,
  Defi: emojis.DEFI,
  Community: emojis.DEFI,
}

function getHelpEmbed(msg: Message, isAdmin: boolean) {
  return composeEmbedMessage(msg, {
    title: `${isAdmin ? "Admin" : "Standard"} Commands`,
    thumbnail: thumbnails.HELP,
    description: `\nType \`${
      isAdmin ? ADMIN_HELP_CMD : HELP_CMD
    } <command>\` to learn more about a command e,g \`${
      isAdmin ? ADMIN_HELP_CMD : HELP_CMD
    } profile\``,
    footer: [`Type ${HELP_CMD} for normal commands`],
  })
}

export async function adminHelpMessage(msg: Message) {
  const embedMsg = getHelpEmbed(msg, true)
  let idx = 0
  for (const [category, emojiId] of Object.entries(categoryIcons)) {
    // const [category, emojiId] = Object.entries(categoryIcons)[i]
    if (category !== "Admin") continue
    const commandsOfThisCat = Object.values(originalCommands)
      .filter(Boolean)
      .filter((c) => c.category === category || c.id === "profile")
      .map((c) => `[\`${c.id}\`](https://google.com)`)
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
    const embedMsg = getHelpEmbed(msg, false)
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
    for (const [category, emojiId] of categories) {
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
