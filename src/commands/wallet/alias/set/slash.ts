import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { ResponseGetTrackingWalletsResponse } from "types/api"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { updateAlias } from "./processor"
import defi from "adapters/defi"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { formatDigit } from "utils/defi"

const command: SlashCommand = {
  name: "set",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("set")
      .setDescription("Set alias for a crypto wallet")
      .addStringOption((opt) =>
        opt
          .setName("wallet")
          .setDescription("Current alias or wallet address")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("New alias for this wallet")
          .setRequired(true)
      )
  },
  autocomplete: async (i) => {
    const focusedValue = i.options.getFocused()
    const { data: res, ok } = await defi.getUserTrackingWallets(i.user.id)
    let following: any[] = []
    let tracking: any[] = []
    let copying: any[] = []
    let wallets: any[] = []

    if (ok) {
      following =
        (res as ResponseGetTrackingWalletsResponse["data"])?.following ?? []
      tracking =
        (res as ResponseGetTrackingWalletsResponse["data"])?.tracking ?? []
      copying =
        (res as ResponseGetTrackingWalletsResponse["data"])?.copying ?? []
    }

    wallets = [...following, ...tracking, ...copying]

    await i.respond(
      wallets
        .filter((w) =>
          w.address.toLowerCase().startsWith(focusedValue.toLowerCase())
        )
        .map((w) => {
          const name = `🔹 ${w.chain_type} | ${
            w.alias || shortenHashOrAddress(w.address)
          } | ${getEmoji("CASH")} $${formatDigit({
            value: w.net_worth.toString(),
            fractionDigits: w.net_worth >= 100 ? 0 : 2,
          })}`
          return {
            value: w.address,
            name: name,
          }
        })
    )
  },
  run: async function (i: CommandInteraction) {
    const wallet = i.options.getString("wallet", true)
    const alias = i.options.getString("alias", true)

    const { msgOpts } = await updateAlias(i, i.user, wallet, alias)

    await i.editReply(msgOpts)
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
