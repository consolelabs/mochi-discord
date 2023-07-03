import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { updateAlias } from "../set/processor"
import defi from "adapters/defi"
import { ResponseGetTrackingWalletsResponse } from "types/api"
import { getEmoji, shortenHashOrAddress } from "utils/common"
import { formatDigit } from "utils/defi"

const command: SlashCommand = {
  name: "remove",
  category: "Defi",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("remove")
      .setDescription("Remove wallet's alias")
      .addStringOption((opt) =>
        opt
          .setName("wallet")
          .setDescription("Current alias or wallet address")
          .setRequired(true)
          .setAutocomplete(true)
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

    // let wallets = [...data?.following, ...data?.tracking, ...data?.watching]
    // let wallets = []
    // console.log(res)
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

    const { msgOpts } = await updateAlias(i, i.user, wallet)

    await i.editReply(msgOpts)
  },
  help: () => Promise.resolve({}),
  colorType: "Defi",
}

export default command
