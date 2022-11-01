import { SlashCommand } from "types/common"
import { SLASH_PREFIX, NFT_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import add from "./add"
import config from "./config"
import integrate from "./integrate"
import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

const subCommands: Record<string, SlashCommand> = {
  add,
  "config_twitter-sale": config,
  integrate,
}

const command: SlashCommand = {
  name: "nft",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("nft")
      .setDescription(
        "Show NFT rarity checker in real-time, including volume, ticker, and sales"
      )

    data.addSubcommand(<SlashCommandSubcommandBuilder>add.prepare())
    data.addSubcommandGroup(
      <SlashCommandSubcommandGroupBuilder>config.prepare()
    )
    data.addSubcommand(<SlashCommandSubcommandBuilder>integrate.prepare())
    return data
  },
  run: async function (interaction: CommandInteraction) {
    return subCommands[interaction.options.getSubcommand()].run(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}nft <collection_symbol> <token_id>\n${SLASH_PREFIX}nft <action>`,
        footer: [
          `Type ${SLASH_PREFIX}help nft <action> for a specific action!`,
        ],
        description:
          "Show NFT rarity checker in real-time, including volume, ticker, and sales",
        examples: `${SLASH_PREFIX}nft list\n${SLASH_PREFIX}nft MUTCATS 1\n${SLASH_PREFIX}mochi bayc 1`,
        document: NFT_GITBOOK,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
