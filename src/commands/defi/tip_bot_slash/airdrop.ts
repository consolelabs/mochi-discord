import { SlashCommand } from "types/common"
import {
  SLASH_PREFIX,
  DEFI_DEFAULT_FOOTER,
  AIRDROP_GITBOOK,
} from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { thumbnails } from "utils/common"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { APIError, GuildIdNotFoundError } from "errors"
import Defi from "adapters/defi"
import { handleAirdrop } from "../airdrop"

const command: SlashCommand = {
  name: "airdrop",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("airdrop")
      .setDescription("Airdrop tokens for a specified number of users.")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("amount you want to airdrop. Example: 5")
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
            "duration of airdrop in seconds, minutes, hours. Example: 5m"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("entries")
          .setDescription("max entries count. Example: 5")
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const amount = interaction.options.getString("amount")
    const token = interaction.options.getString("token")
    const duration = interaction.options.getString("duration")
    const entries = interaction.options.getString("entries")
    if (!amount || !token || !duration || !entries) {
      throw new DiscordWalletTransferError({
        discordId: interaction.user.id,
        message: interaction,
        error: "Invalid airdrop command",
      })
    }

    const payload = await Defi.getAirdropPayload(interaction, [
      "airdrop",
      amount,
      token,
      "in",
      duration,
      "for",
      entries,
    ])
    // check balance
    const {
      ok,
      data = [],
      log,
      curl,
    } = await Defi.offchainGetUserBalances({
      userId: payload.sender,
    })
    // tipbot response shouldn't be null
    if (!ok || !data) {
      throw new APIError({ curl: curl, description: log })
    }

    return await handleAirdrop(interaction, payload, data)
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

export default command
