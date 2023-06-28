import { CommandInteraction, Message } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { run as tickerRun, TickerView } from "commands/ticker/index/processor"
import { machineConfig as tickerMachineConfig } from "commands/ticker/index/slash"
import { parseTickerQuery } from "utils/defi"
import { route } from "utils/router"

const command: SlashCommand = {
  name: "info",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Information of a token.")
      .addStringOption((option) =>
        option
          .setName("symbol")
          .setDescription("token's symbol. Example: FTM")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({ message: interaction })
    }

    const symbol = interaction.options.getString("symbol", true)

    const { base, target, isCompare, isFiat } = parseTickerQuery(symbol)
    const { initial, msgOpts, context } = await tickerRun(
      interaction,
      base,
      target,
      isCompare,
      isFiat,
      TickerView.Info
    )

    const reply = (await interaction.editReply(msgOpts)) as Message

    route(reply, interaction, tickerMachineConfig(base, context, initial))
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}tokens info <symbol>\n${SLASH_PREFIX}tokens info <id>`,
          examples: `${SLASH_PREFIX}tokens info eth\n${SLASH_PREFIX}tokens info ethereum`,
        }),
      ],
    }),
  colorType: "Defi",
}

export default command
