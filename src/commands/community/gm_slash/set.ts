import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandError, GuildIdNotFoundError } from "errors"
import { handle } from "../gm/config"

export async function gmSet(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    throw new GuildIdNotFoundError({})
  }
  const chanArg = interaction.options.getChannel("channel")
  if (!chanArg) {
    throw new CommandError({
      description: "Invalid channel, please choose a text channel.",
    })
  }

  const chan = await interaction.guild.channels
    .fetch(chanArg?.id ?? "")
    .catch(() => undefined)
  if (!chan || !chan.isText()) {
    throw new CommandError({
      description: "Invalid channel, please choose a text channel.",
    })
  }

  return await handle(interaction.guildId, chan.id)
}

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Create gm channel")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription(
        "the channel which you wanna set as gm. Example: #general"
      )
      .setRequired(true)
  )
