import { CommandInteraction } from "discord.js"
import { HELP_CMD, HOMEPAGE_URL } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { slashCommands } from "../index"
import { emojis, thumbnails } from "utils/common"
import config from "../adapters/config"
import { Category, SlashCommand } from "types/common"
import {
  composeEmbedMessage2,
  EMPTY_FIELD,
  justifyEmbedFields,
} from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
dayjs.extend(utc)

const categoryIcons: Record<Category, string> = {
  Profile: emojis.PROFILE,
  Config: emojis.PROFILE,
  Defi: emojis.DEFI,
  Community: emojis.DEFI,
  Game: emojis.GAME,
}

function getHelpEmbed(interaction: CommandInteraction) {
  return composeEmbedMessage2(interaction, {
    title: "Mochi's Help",
    thumbnail: thumbnails.HELP,
    // description: `Use \`${HELP_CMD} <command>\` for more details about a specific command`,
    footer: [`Use ${HELP_CMD} <command> for details on a specific command`],
  })
}

/**
 * Validate if categories for admin can be displayed.
 * Sort categories by number of their commands in DESCENDING order
 *
 */
async function displayCategories() {
  return Object.entries(categoryIcons).sort((catA, catB) => {
    const commandsOfThisCatA: number = Object.values(slashCommands)
      .filter(Boolean)
      .filter((c) => c.category === catA[0]).length
    const commandsOfThisCatB: number = Object.values(slashCommands)
      .filter(Boolean)
      .filter((c) => c.category === catB[0]).length

    return commandsOfThisCatB - commandsOfThisCatA
  })
}

const command: SlashCommand = {
  name: "help",
  category: "Profile",
  prepare: (slashCommands) => {
    const choices = Object.keys(slashCommands ?? {})
      .filter((c) => c !== "help")
      .map((c) => [`/${c}`, c]) as [string, string][]
    return new SlashCommandBuilder()
      .setName("help")
      .setDescription("Help Menu")
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription("Command to provide details about.")
          .setRequired(false)
          .setChoices(choices)
      )
  },
  run: async function (interaction: CommandInteraction) {
    const command = interaction.options.getString("command")
    const messageOptions = await (slashCommands[command ?? ""] ?? this).help(
      interaction
    )
    return { messageOptions }
  },
  help: async (interaction: CommandInteraction) => {
    const embed = getHelpEmbed(interaction)
    const categories = await displayCategories()

    let idx = 0
    for (const item of Object.values(categories)) {
      const category = item[0]
      if (!(await config.slashCategoryIsScoped(interaction, category))) continue

      const commandsByCat = (
        await Promise.all(
          Object.values(slashCommands)
            .filter((cmd) => cmd.name !== "help")
            .filter(
              async (cmd) =>
                await config.slashCommandIsScoped({
                  interaction,
                  category: cmd.category,
                  command: cmd.name,
                })
            )
        )
      )
        .filter((c) => c.category === category)
        .map((c) => `[\`${c.name}\`](${HOMEPAGE_URL})`)
        .join(" ")

      if (!commandsByCat) continue

      // add blank field as the third column
      if (idx % 3 === 2) embed.addFields(EMPTY_FIELD)
      embed.addField(`${category}`, `${commandsByCat}`, true)
      idx++
    }

    return { embeds: [justifyEmbedFields(embed, 3)] }
  },
  colorType: "Command",
}

export default command
