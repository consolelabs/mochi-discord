import { Message } from "discord.js"
import { ADMIN_PREFIX, PREFIX } from "../env"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { Category, originalCommands, Command } from "../commands"
import {
  emojis,
  getEmbedFooter,
  getEmoji,
  getHelpEmbed,
  thumbnails,
} from "utils/discord"
import guildConfig from "../modules/guildConfig"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Admin: emojis.NEKO_COOL,
  Games: emojis.GAMES,
  Council: emojis.COUNCIL,
  Profile: emojis.PROFILE,
  Leaderboard: emojis.LEADERBOARD,
  Social: emojis.SOCIAL,
}

export async function adminHelpMessage(msg: Message) {
  let embedMsg = getHelpEmbed("Admin Commands")
    .setThumbnail(thumbnails.HELP)
    .setDescription(
      `\nType \`${ADMIN_PREFIX}help <command>\` to learn more about a command e,g \`${ADMIN_PREFIX}help profile\``
    )
    .setFooter(getEmbedFooter([`Type ${PREFIX}help for normal commands`]))
    .setTimestamp()

  for (let [category, emojiId] of Object.entries(categoryIcons)) {
    if (category !== "Admin") continue
    const commandsOfThisCat = Object.values(originalCommands)
      .filter(Boolean)
      .filter(
        (c) =>
          c.category === category || c.id === "profile" || c.id === "together"
      )
      .map((c) => `[\`${c.id}\`](https://pod.town)`)
      .join(" ")
    if (commandsOfThisCat.trim() === "") continue
    const emoji = msg.client.emojis.cache.get(emojiId)
    embedMsg.addField(
      `${emoji ? `${emoji} ` : ""}${category}`,
      `${commandsOfThisCat}\n${getEmoji("blank")}`,
      true
    )
  }
  return { embeds: [embedMsg] }
}

const info = {
  id: "help",
  command: "help",
  category: "Profile",
  name: "Help Menu",
  run: async function (msg) {
    const data = await this.getHelpMessage(msg)
    return data
  },
  getHelpMessage: async (msg: Message) => {
    let embedMsg = getHelpEmbed("Standard Commands")
      .setTitle("Welcome to Pod Town!")
      .setThumbnail(thumbnails.HELP)
      .setDescription(
        `\nType \`${PREFIX}help <command>\` to learn more about a command e,g \`${PREFIX}help neko\`\n${getEmoji(
          "blank"
        )}`
      )
      .setFooter(
        getEmbedFooter([`Type ${ADMIN_PREFIX}help for admin commands`])
      )
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
      embedMsg.addField(
        `${emoji ? `${emoji} ` : ""}${category}`,
        `${commandsOfThisCat}\n${getEmoji("blank")}`,
        true
      )
    }
    return { embeds: [embedMsg] }
  },
} as Command

const help = info.getHelpMessage

export { help }
