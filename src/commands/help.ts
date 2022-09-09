import { Message } from "discord.js"
import { HELP_CMD, HELP_GITBOOK } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { originalCommands } from "../commands"
import { emojis, thumbnails } from "utils/common"
import config from "../adapters/config"
import { Category, Command } from "types/common"
import {
  composeEmbedMessage,
  EMPTY_FIELD,
  justifyEmbedFields,
} from "utils/discordEmbed"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Profile: emojis.PROFILE,
  Config: emojis.PROFILE,
  Defi: emojis.DEFI,
  Community: emojis.DEFI,
  Game: emojis.GAME,
}

function getHelpEmbed(msg: Message, isAdmin: boolean) {
  return composeEmbedMessage(msg, {
    title: `${isAdmin ? "Admin" : "Standard"} Commands`,
    thumbnail: thumbnails.HELP,
    description: `\nType \`${HELP_CMD} <command>\` to learn more about a command`,
    footer: [`Type ${HELP_CMD} for normal commands`],
  })
}

/**
 * Validate if categories for admin can be displayed.
 * Sort categories by number of their commands in DESCENDING order
 *
 */
async function displayCategories() {
  return (
    Object.entries(categoryIcons)
      // .filter((cat) => isAdmin || !adminCategories[cat[0] as Category])
      .sort((catA, catB) => {
        const commandsOfThisCatA = Object.values(originalCommands)
          .filter(Boolean)
          .filter((c) => c.category === catA[0]).length
        const commandsOfThisCatB = Object.values(originalCommands)
          .filter(Boolean)
          .filter((c) => c.category === catB[0]).length

        return commandsOfThisCatB - commandsOfThisCatA
      })
  )
}

const command: Command = {
  id: "help",
  command: "help",
  category: "Profile",
  brief: "Help Menu",
  run: async function (msg: Message) {
    const data = await this.getHelpMessage(msg)
    return { messageOptions: data }
  },
  getHelpMessage: async (msg: Message) => {
    const embed = getHelpEmbed(msg, false)
    const categories = await displayCategories()

    let idx = 0
    for (const item of Object.values(categories)) {
      const category = item[0]
      if (!(await config.categoryIsScoped(msg, category))) continue

      const commandsByCat = (
        await Promise.all(
          Object.values(originalCommands)
            .filter((cmd) => cmd.id !== "help")
            .filter(
              async (cmd) =>
                await config.commandIsScoped(msg, cmd.category, cmd.command)
            )
        )
      )
        .filter((c) => c.category === category && !c.experimental)
        .map((c) => `[\`${c.command}\`](https://google.com)`)
        .join(" ")

      if (!commandsByCat) continue

      // add blank field as the third column
      if (idx % 3 === 2) embed.addFields(EMPTY_FIELD)
      embed.addField(`${category}`, `${commandsByCat}`, true)
      idx++
    }
    embed.addField("**Document**", `[**Gitbook**](${HELP_GITBOOK})`)

    return { embeds: [justifyEmbedFields(embed, 3)] }
  },
  allowDM: true,
  colorType: "Command",
}

export default command
