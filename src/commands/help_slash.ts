import { CommandInteraction, Message, User } from "discord.js"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { thumbnails } from "utils/common"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { slashCommands } from "commands"
import { buildHelpInterface, PageType, pagination } from "./help"
dayjs.extend(utc)

const image =
  "https://cdn.discordapp.com/attachments/984660970624409630/1023869479521882193/help2.png"

function getHelpEmbed(user: User) {
  return composeEmbedMessage(null, {
    title: `Mochi Bot Commands`,
    author: ["Mochi Bot", thumbnails.HELP],
    image,
  }).setFooter(user?.tag, user.avatarURL() ?? undefined)
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
    await (slashCommands[command ?? ""] ?? this).help(interaction)
    return null
  },
  help: async (interaction) => {
    const embed = getHelpEmbed(interaction.user)
    buildHelpInterface(embed, "social", "/")

    const replyMsg = (await interaction.editReply({
      embeds: [embed],
      components: pagination("social"),
    })) as Message

    replyMsg
      .createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
      })
      .on("collect", (i) => {
        i.deferUpdate()
        const pageType = i.customId as PageType
        const embed = getHelpEmbed(interaction.user)
        buildHelpInterface(embed, pageType, "/")

        interaction
          .editReply({
            embeds: [embed],
            components: pagination(pageType),
          })
          .catch(() => null)
      })
      .on("end", () => {
        interaction.editReply({ components: [] }).catch(() => null)
      })

    return {}
  },
  colorType: "Command",
}

export default command
