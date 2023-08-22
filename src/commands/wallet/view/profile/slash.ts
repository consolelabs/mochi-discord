import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import profile from "adapters/profile"
import {
  BalanceType,
  BalanceView,
  renderBalances,
} from "commands/balances/index/processor"
import { machineConfig } from "commands/wallet/common/tracking"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { lookUpDomains } from "utils/common"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import { route } from "utils/router"

const command: SlashCommand = {
  name: "view-profile",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("profile")
      .setDescription("Show other members' wallet assets and activities.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription(
            "Nickname or mention of wallet's owner. Example: @John"
          )
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("wallet")
          .setDescription(
            "The address or alias of the wallet you want to track"
          )
          .setRequired(true)
          .setAutocomplete(true)
      )
  },
  autocomplete: async (i) => {
    const user = i.options.get("user", true).value as string | undefined
    const discordId = user ?? i.user.id
    const focusedValue = i.options.getFocused()
    // do not fetch amount because
    // we need to respond within 3 seconds (discord api is amazing ¯\_(ツ)_/¯)
    const { wallets } = await profile.getUserWallets(discordId)

    const options = await Promise.all(
      [...wallets]
        .filter((w) =>
          w.value.toLowerCase().startsWith(focusedValue.toLowerCase())
        )
        .map(async (w) => {
          let value = w.value
          if (value.startsWith("ronin:")) {
            value = value.slice(6)
          } else if (value.endsWith(".near")) {
            value = value.slice(0, -5)
          }

          return {
            value: w.value,
            name: `🔷 ${w.chain.toUpperCase()} | ${
              w.alias || (await lookUpDomains(w.value))
            } | $${w.total}`,
          }
        })
    )

    await i.respond(options).catch(() => null)
  },
  run: async (interaction) => {
    const address = interaction.options.getString("wallet", true)

    const { context, msgOpts } = await renderBalances(
      // TODO: this id currently is wrong
      interaction.user.id,
      {
        interaction,
        type: BalanceType.Onchain,
        address,
        view: BalanceView.Compact,
      }
    )

    const reply = await interaction.editReply(msgOpts)

    route(reply as Message, interaction, machineConfig("wallet", context))
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
