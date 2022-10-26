import config from "adapters/config"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SLASH_PREFIX } from "utils/constants"

export const message = new SlashCommandSubcommandBuilder()
  .setName("message")
  .setDescription("Set the welcome message")
  .addStringOption((option) =>
    option
      .setName("message")
      .setDescription(
        "use $name in place of new member's name. Example: Hi $name, welcome to Mochi!"
      )
      .setRequired(false)
  )

export async function setWelcomeMessage(interaction: CommandInteraction) {
  if (!interaction.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }

  const currentWelcomeConfig = await config.getCurrentWelcomeConfig(
    interaction.guild.id
  )
  if (!currentWelcomeConfig.ok) {
    throw new Error(`Failed to get current welcome message`)
  }
  if (currentWelcomeConfig.data == null) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: `Please set a welcome channel first using \`${SLASH_PREFIX}welcome set\` `,
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  }

  let messageArg = interaction.options.getString("message")
  if (!messageArg) {
    messageArg = ""
  }
  const newConfig = await config.updateWelcomeConfig(
    interaction.guild.id,
    currentWelcomeConfig.data.channel_id ?? "",
    messageArg
  )
  if (!newConfig.ok) {
    throw new Error(`Failed to update welcome message`)
  }

  const newConfigData = newConfig.data
  if (!newConfigData) {
    throw new Error(`Failed to update welcome message`)
  }

  let msg = newConfigData.welcome_message ?? "Not found"
  if (msg.length > 50) {
    msg = msg.replace(msg.slice(49, msg.length), "...")
  }
  const embed = getSuccessEmbed({
    title: interaction.guild.name,
    description: `Successfully set new welcome message: ${msg}\nWelcome channel: <#${newConfig.data.channel_id}>`,
    originalMsgAuthor: interaction.user,
  })
  return { messageOptions: { embeds: [embed] } }
}
