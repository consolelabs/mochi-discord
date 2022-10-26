import config from "adapters/config"
import { getErrorEmbed, getSuccessEmbed } from "utils/discordEmbed"
import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { parseDiscordToken } from "utils/commands"

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set welcome channel to greet mew members")
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "the channel which you want to welcome new members. #general"
      )
      .setRequired(true)
  )

export async function setWelcome(interaction: CommandInteraction) {
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

  const { isChannel, value: channelId } = parseDiscordToken(
    interaction.options.getString("channel") ?? ""
  )
  if (!isChannel) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Invalid channel. Please choose another one!",
          }),
        ],
      },
    }
  }

  const chan = await interaction.guild.channels
    .fetch(channelId)
    .catch(() => undefined)
  if (!chan)
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Channel not found",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  if (!chan.isText())
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Channel has to be text",
            originalMsgAuthor: interaction.user,
          }),
        ],
      },
    }
  const newConfig = await config.updateWelcomeConfig(
    interaction.guild.id,
    channelId
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
    description: `Successfully set <#${channelId}> as welcome channel.\nWelcome message: ${msg}`,
    originalMsgAuthor: interaction.user,
  })
  return { messageOptions: { embeds: [embed] } }
}
