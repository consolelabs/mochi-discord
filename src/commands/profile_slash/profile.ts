import { SlashCommand } from "types/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { composeEmbedMessage } from "utils/discordEmbed"
import { handleProfile } from "commands/profile/profile"

const command: SlashCommand = {
  name: "profile",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("profile")
      .setDescription("User's profile")
      .addStringOption((option) =>
        option
          .setName("user")
          .setDescription("user's nickname or mention. Example: @John")
          .setRequired(false)
      )
    return data
  },
  run: async function (interaction: CommandInteraction) {
    const user = interaction.options.getString("user")
    const args = ["profile"]
    if (user) args.push(user)
    return await handleProfile(interaction, args)
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default command
