import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import profile from "adapters/profile"
import { BalanceType, renderBalances } from "commands/balances/index/processor"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import { route } from "utils/router"
import { machineConfig } from "commands/wallet/common/tracking"

const command: SlashCommand = {
  name: "view",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("Show the wallet's assets and activities.")
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription(
            "The address or alias of the wallet you want to track"
          )
          .setAutocomplete(true)
          .setRequired(true)
      )
  },
  autocomplete: async (i) => {
    const focusedValue = i.options.getFocused()
    const { mochiWallets, wallets } = await profile.getUserWallets(i.user.id)

    await i.respond(
      [...mochiWallets, ...wallets]
        .filter((w) =>
          w.value.toLowerCase().startsWith(focusedValue.toLowerCase())
        )
        .map((w) => ({ value: w.value, name: w.value }))
    )
  },
  run: async (interaction) => {
    const address = interaction.options.getString("address", true)

    const { messageOptions } = await renderBalances(
      // TODO: this id currently is wrong
      interaction.user.id,
      interaction,
      BalanceType.Onchain,
      address,
      "compact"
    )

    const reply = await interaction.editReply(messageOptions)

    route(reply as Message, interaction, machineConfig("wallet", {}))
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}wallet view [address]/[alias]`,
          examples: `${SLASH_PREFIX}wallet view\n${SLASH_PREFIX}wallet view 0xfBe6403a719d0572Ea4BA0E1c01178835b1D3bE4\n${SLASH_PREFIX}wallet view mywallet`,
          document: `${WALLET_GITBOOK}&action=view`,
        }),
      ],
    }),
  colorType: "Server",
}

export default command
