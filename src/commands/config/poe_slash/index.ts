import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX, TWITTER_WATCH_GITBOOK } from "utils/constants"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import twitter from "./twitter/index"

const subCommands: Record<string, SlashCommand> = {
  twitter,
}

const command: SlashCommand = {
  name: "poe",
  category: "Config",
  onlyAdministrator: true,
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("poe")
      .setDescription("Proof of Engagement")

    data.addSubcommandGroup(
      <SlashCommandSubcommandGroupBuilder>twitter.prepare()
    )
    return data
  },
  run: (interaction: CommandInteraction) => {
    return subCommands[interaction.options.getSubcommandGroup(true)].run(
      interaction
    )
  },
  help: async (interaction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}poe <twitter>`,
        description: "Configure your server's PoE to drive engagement",
        examples: `${SLASH_PREFIX}poe twitter set #general #mochitag,@Mochi Bot`,
        document: TWITTER_WATCH_GITBOOK,
        footer: [
          `Type ${SLASH_PREFIX}help poe <action> for a specific action!`,
        ],
      }),
    ],
  }),
  colorType: "Server",
}

export default command
