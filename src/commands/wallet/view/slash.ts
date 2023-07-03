import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import profile from "adapters/profile"
import {
  BalanceType,
  BalanceView,
  renderBalances,
} from "commands/balances/index/processor"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX, WALLET_GITBOOK } from "utils/constants"
import { route } from "utils/router"
import { machineConfig } from "commands/wallet/common/tracking"
import { getEmoji, lookUpDomains } from "utils/common"
import { formatDigit } from "utils/defi"

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
    // do not fetch amount because
    // we need to respond within 3 seconds (discord api is amazing ¯\_(ツ)_/¯)
    const { wallets } = await profile.getUserWallets(i.user.id, false)

    const options = await Promise.all(
      [...wallets]
        .filter((w) =>
          w.value.toLowerCase().startsWith(focusedValue.toLowerCase())
        )
        .map(async (w) => {
          return {
            value: w.value,
            name: `🔷 ${w.chain.toUpperCase()} | ${
              w.alias || (await lookUpDomains(w.value))
            } | ${getEmoji("CASH")} $${formatDigit({
              value: w.total,
              fractionDigits: +w.total >= 100 ? 0 : 2,
            })}`,
          }
        })
    )

    await i.respond(options).catch(() => null)
  },
  run: async (interaction) => {
    const address = interaction.options.getString("address", true)

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
