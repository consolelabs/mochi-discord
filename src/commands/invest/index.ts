import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import info from "./info/slash"
import stake from "./stake/slash"
import unstake from "./unstake/slash"
import portfolio from "./portfolio/slash"
import claimRewards from "./claim-rewards/slash"
import transaction from "./transaction/slash"
import { CommandInteraction } from "discord.js"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"

const slashActions: Record<string, SlashCommand> = {
  info,
  stake,
  unstake,
  claim: claimRewards,
  portfolio,
  transaction,
}

const slashCmd: SlashCommand = {
  name: "invest",
  category: "Defi",

  autocomplete: async function (i) {
    const subCmd = i.options.getSubcommand()
    slashActions[subCmd]?.autocomplete?.(i)
    return Promise.resolve()
  },
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("invest")
      .setDescription("Let money work for you")
    for (const action in slashActions) {
      data.addSubcommand(
        <SlashCommandSubcommandBuilder>slashActions[action].prepare(),
      )
    }
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return await slashActions[interaction.options.getSubcommand()].run(
      interaction,
    )
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          usage: `${SLASH_PREFIX}invest <action>`,
          examples: `${SLASH_PREFIX}invest info\n${SLASH_PREFIX}`,
          footer: [`Type ${SLASH_PREFIX}help invest for a specific action!`],
          includeCommandsList: true,
          originalMsgAuthor: interaction.user,
        }),
      ],
    }),
  colorType: "Defi",
}

export default { slashCmd }
