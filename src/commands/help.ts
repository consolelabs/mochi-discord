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
  Community: emojis.DEFI
}

function getHelpEmbed(msg: Message, isAdmin: boolean) {
  return composeEmbedMessage(msg, {
    title: `${isAdmin ? "Admin" : "Standard"} Commands`,
    thumbnail: thumbnails.HELP,
    description: `\nType \`${HELP_CMD} <command>\` to learn more about a command`,
    footer: [`Type ${HELP_CMD} for normal commands`]
  })
}

/**
 * Validate if categories for admin can be displayed.
 * Sort categories by number of their commands in DESCENDING order
 *
 */
async function displayCategories(_msg: Message) {
  // const isAdmin =
  //   msg.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR) &&
  //   (await onlyRunInAdminGroup(msg))
  return (
    Object.entries(categoryIcons)
      // .filter((cat) => isAdmin || !adminCategories[cat[0] as Category])
      .sort((catA, catB) => {
        const commandsOfThisCatA = Object.values(originalCommands)
          .filter(Boolean)
          .filter(c => c.category === catA[0]).length
        const commandsOfThisCatB = Object.values(originalCommands)
          .filter(Boolean)
          .filter(c => c.category === catB[0]).length

        return commandsOfThisCatB - commandsOfThisCatA
      })
  )
}

const command: Command = {
  id: "help",
  command: "help",
  category: "Profile",
  brief: "Help Menu",
  run: async function(msg: Message) {
    const data = await this.getHelpMessage(msg)
    return { messageOptions: data }
  },
  getHelpMessage: async (msg: Message) => {
    const embedMsg = getHelpEmbed(msg, false)
    const categories = await displayCategories(msg)

    let idx = 0
    for (const [category, _emojiId] of categories) {
      if (!(await config.categoryIsScoped(msg.guildId, category))) continue

      const commandsByCat = (
        await Promise.all(
          Object.values(originalCommands)
            .filter(cmd => cmd.id !== "help")
            .filter(
              async cmd =>
                await config.commandIsScoped(
                  msg.guildId,
                  cmd.category,
                  cmd.command
                )
            )
        )
      )
        .filter(c => c.category === category && !c.experimental)
        .map(c => `[\`${c.command}\`](https://google.com)`)
        .join(" ")

      if (!commandsByCat) continue

      // add blank field as the third column
      if (idx % 3 === 2) embedMsg.addField("\u200B", "\u200B", true)
      embedMsg.addField(`${category}`, `${commandsByCat}`, true)
      idx++
    }

    // add blank fields to the last row if not enough 3 cols
    const nrOfEmptyFields = 3 - (embedMsg.fields.length % 3)
    new Array(nrOfEmptyFields)
      .fill(0)
      .forEach(() => embedMsg.addField("\u200B", "\u200B", true))

    return { embeds: [embedMsg] }
  }
}

export default command
