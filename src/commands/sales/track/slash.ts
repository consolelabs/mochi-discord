import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SALE_TRACKER_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handleSalesTrack } from "./processor"

const command: SlashCommand = {
  name: "track",
  category: "Community",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("track")
      .setDescription("Setup a sales tracker for an NFT collection.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(
            "channel you want to send trackers. Example: #general",
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "collection's address. Example: 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73",
          )
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("chain")
          .setDescription("collection's chain'. Example: eth")
          .setRequired(true),
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const address = interaction.options.getString("address")
    const channel = interaction.options.getChannel("channel")
    const chain = interaction.options.getString("chain")

    return await handleSalesTrack(
      interaction,
      address,
      chain,
      interaction.guildId,
      channel ? channel.id : "",
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}sales track <channel> <address> <chain_id>\n${SLASH_PREFIX}sales track <channel> <address> <chain_symbol>`,
        examples: `${SLASH_PREFIX}sales track #general 0x7aCeE5D0acC520faB33b3Ea25D4FEEF1FfebDE73 250\n${SLASH_PREFIX}sales track #general 0x343f999eAACdFa1f201fb8e43ebb35c99D9aE0c1 eth`,
        document: `${SALE_TRACKER_GITBOOK}&action=track`,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default command
