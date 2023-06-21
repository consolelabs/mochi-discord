import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { run } from "./processor"

const command: SlashCommand = {
  name: "daily",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("daily")
      .setDescription("Your daily quests, resets at 00:00 UTC")
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const { msgOpts: messageOptions } = await run(interaction.user.id)
    return {
      messageOptions,
    }
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(interaction, {
        description: "Check on your quests and what rewards you can claim",
        usage: `${SLASH_PREFIX}quest daily`,
        examples: `${SLASH_PREFIX}quest daily`,
        footer: [`Type ${SLASH_PREFIX}help quest`],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
