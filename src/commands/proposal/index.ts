import { SlashCommand } from "types/common"
import { DAO_VOTING_GITBOOK, PREFIX, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import infoSlash from "./info/slash"
import trackSlash from "./track/slash"
import untrackSlash from "./untrack/slash"
import dataSlash from "./data/slash"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const slashActions: Record<string, SlashCommand> = {
  info: infoSlash,
  track: trackSlash,
  untrack: untrackSlash,
  data: dataSlash,
}

const slashCmd: SlashCommand = {
  name: "proposal",
  category: "Community",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("proposal")
      .setDescription("Manage to post proposals and their voting space")

    data.addSubcommand(<SlashCommandSubcommandBuilder>infoSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>untrackSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>trackSlash.prepare())
    data.addSubcommand(<SlashCommandSubcommandBuilder>dataSlash.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return slashActions[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        title: "DAO Voting",
        description: "Manage to post proposals and their voting space",
        usage: `${SLASH_PREFIX}proposal <action>`,
        document: DAO_VOTING_GITBOOK,
        examples: `${SLASH_PREFIX}proposal info\n${SLASH_PREFIX}proposal set #channel eth 0xad29abb318791d579433d831ed122afeaf29dcfe`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}
export default { slashCmd }
