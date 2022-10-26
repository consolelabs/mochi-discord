import { ColorResolvable, CommandInteraction, User } from "discord.js"
import { HELP_GITBOOK, HOMEPAGE_URL } from "utils/constants"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { thumbnails } from "utils/common"
import { embedsColors, SlashCommand } from "types/common"
import { composeEmbedMessage, justifyEmbedFields } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { slashCommands } from "commands"
import { buildHelpInterface } from "./help"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

function getHelpEmbed(user: User) {
  return composeEmbedMessage(null, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
  }).setFooter(user?.tag, user.avatarURL() || undefined)
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
          .setDescription(
            "Command to provide details about. Example: watchlist"
          )
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
  help: async (interaction) => {
    const embed = getHelpEmbed(interaction.user)
    buildHelpInterface(embed, "/")

    embed.addFields(
      {
        name: "**Examples**",
        value: `\`\`\`/help invite\`\`\``,
      },
      {
        name: "**Document**",
        value: `[**Gitbook**](${HELP_GITBOOK}&command=help)`,
        inline: true,
      },
      {
        name: "**Bring the Web3 universe to your Discord**",
        value: `[**Website**](${HOMEPAGE_URL})`,
        inline: true,
      }
    )

    embed.setColor(embedsColors.Game as ColorResolvable)
    return {
      embeds: [justifyEmbedFields(embed, 3)],
    }
  },
  colorType: "Command",
}

export default command
