import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { daily, dailyMetadata } from "./daily"

const command: SlashCommand = {
  name: "quest",
  category: "Community",
  onlyAdministrator: true,
  help: async () => {
    const embed = composeEmbedMessage(null, {
      description: "Check on your quests and what rewards you can claim",
      usage: `${PREFIX}quest `,
      footer: [`Type ${PREFIX}help quest`],
      examples: `${PREFIX}quest`,
    })

    return { embeds: [embed] }
  },
  colorType: "Server",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setDescription("Check on your quests and what rewards you can claim")
      .setName("quest")

    data.addSubcommand(dailyMetadata)

    return data
  },
  run: async (interaction) => {
    if (interaction.options.getSubcommand() === dailyMetadata.name) {
      return daily(interaction)
    }
  },
}

export default command
