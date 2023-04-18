import { SlashCommand } from "types/common"
import { CommandInteraction } from "discord.js"
import {
  AIRDROP_GITBOOK,
  DEFI_DEFAULT_FOOTER,
  SLASH_PREFIX,
} from "utils/constants"
import { GuildIdNotFoundError } from "errors"
import { thumbnails } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { SlashCommandBuilder } from "@discordjs/builders"
import airdropSlash from "./index/slash"

const slashCmd: SlashCommand = {
  name: "airdrop",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("airdrop")
      .setDescription("Airdrop tokens for a specified number of users.")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("amount you want to airdrop. Example: 5, all, etc.")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("symbol of token. Example: ftm")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("duration")
          .setDescription(
            "duration in seconds, minutes (default) or hour (max 1 hour). Example: 5m, 1hr, 20m 10secs, etc..."
          )
      )
      .addNumberOption((option) =>
        option
          .setName("entries")
          .setDescription("max entries count. Example: 5")
          .setMinValue(1)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return await airdropSlash(interaction)
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        thumbnail: thumbnails.TOKENS,
        usage: `${SLASH_PREFIX}airdrop <amount> <token> <duration> <max entries>`,
        description:
          "Airdrop offchain tokens for a specified number of users to collect in a given amount of time",
        footer: [DEFI_DEFAULT_FOOTER],
        examples: `${SLASH_PREFIX}airdrop 10 ftm\n${SLASH_PREFIX}airdrop 10 ftm in 5m\n${SLASH_PREFIX}airdrop 10 ftm in 5m for 6`,
        document: AIRDROP_GITBOOK,
      }),
    ],
  }),
  colorType: "Defi",
}

export default { slashCmd }
