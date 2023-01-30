import { CommandInteraction } from "discord.js"
import { DiscordWalletTransferError } from "errors/discord-wallet-transfer"
import { APIError } from "errors"
import Defi from "adapters/defi"
import { getAirdropPayload, handleAirdrop } from "./processor"

async function run(interaction: CommandInteraction) {
  const amount = interaction.options.getNumber("amount")
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

  const payload = await getAirdropPayload(interaction, [
    "airdrop",
    amount.toString(),
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
}

export default run
