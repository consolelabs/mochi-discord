import { Message } from "discord.js"
import { HELP_GITBOOK, HOMEPAGE_URL } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { originalCommands } from "../commands"
import { capFirst, thumbnails } from "utils/common"
import config from "../adapters/config"
import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

// const categoryIcons: Record<Category, string> = {
//   Profile: emojis.PROFILE,
//   Config: emojis.PROFILE,
//   Defi: emojis.DEFI,
//   Community: emojis.DEFI,
//   Game: emojis.GAME,
// }

function getHelpEmbed(msg: Message) {
  return composeEmbedMessage(msg, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
  })
}

/**
 * Validate if categories for admin can be displayed.
 * Sort categories by number of their commands in DESCENDING order
 *
 */
// async function displayCategories() {
//   return (
//     Object.entries(categoryIcons)
//       // .filter((cat) => isAdmin || !adminCategories[cat[0] as Category])
//       .sort((catA, catB) => {
//         const commandsOfThisCatA = Object.values(originalCommands)
//           .filter(Boolean)
//           .filter((c) => c.category === catA[0]).length
//         const commandsOfThisCatB = Object.values(originalCommands)
//           .filter(Boolean)
//           .filter((c) => c.category === catB[0]).length
//
//         return commandsOfThisCatB - commandsOfThisCatA
//       })
//   )
// }

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
    const embed = getHelpEmbed(msg)
    // const categories = await displayCategories()
    //
    // let idx = 0
    // for (const item of Object.values(categories)) {
    //   const category = item[0]
    //   if (!(await config.categoryIsScoped(msg, category))) continue
    //
    //   const commandsByCat = (
    //     await Promise.all(
    //       Object.values(originalCommands)
    //         .filter((cmd) => cmd.id !== "help")
    //         .filter(
    //           async (cmd) =>
    //             await config.commandIsScoped(msg, cmd.category, cmd.command)
    //         )
    //     )
    //   )
    //     .filter((c) => c.category === category && !c.experimental)
    //     .map((c) => `[\`${c.command}\`](https://google.com)`)
    //     .join(" ")
    //
    //   if (!commandsByCat) continue
    //
    //   // add blank field as the third column
    //   if (idx % 3 === 2) embed.addFields(EMPTY_FIELD)
    //   embed.addFields({
    //     name: `${category}`,
    //     value: `${commandsByCat}`,
    //     inline: true,
    //   })
    //   idx++
    // }
    const commands = await Promise.all(
      Object.values(originalCommands)
        .filter((cmd) => cmd.id !== "help")
        .filter((cmd) => cmd.featured)
        .filter(
          async (cmd) =>
            await config.commandIsScoped(msg, cmd.category, cmd.command)
        )
    )
    commands.forEach((cmd) => {
      embed.addFields({
        name: capFirst(cmd.featured?.title ?? ""),
        value: `\`$${cmd.command}\`\n${cmd.featured?.description ?? ""}`,
        inline: true,
      })
    })
    embed.addFields(
      {
        name: "Bring the Web3 universe to your Discord",
        value: `[**[Webite]**](${HOMEPAGE_URL})`,
        inline: true,
      },
      {
        name: "**Examples**",
        value: `\`\`\`$help invite\`\`\``,
      },
      {
        name: "**Document**",
        value: `[**Gitbook**](${HELP_GITBOOK})`,
      }
    )

    return { embeds: [embed] }
  },
  allowDM: true,
  colorType: "Game",
}

export default command
