import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { ResponseGetTrackingWalletsResponse } from "types/api"

import { SlashCommandSubcommandBuilder } from "@discordjs/builders"

import { updateAlias } from "./processor"
import defi from "adapters/defi"
import { lookUpDomains } from "utils/common"
import { formatUsdDigit } from "utils/defi"
import { getProfileIdByDiscord } from "../../../../utils/profile"

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
          .setAutocomplete(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("alias")
          .setDescription("New alias for this wallet")
          .setRequired(true),
      )
  },
  autocomplete: async (i) => {
    const focusedValue = i.options.getFocused()
    const profileId = await getProfileIdByDiscord(i.user.id)
    const { data: res, ok } = await defi.getUserTrackingWallets(profileId)
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

    const options = await Promise.all(
      wallets
        .filter((w) =>
          w.address.toLowerCase().startsWith(focusedValue.toLowerCase()),
        )
        .map(async (w) => {
          return {
            value: w.address,
            name: `🔷 ${w.chain_type.toUpperCase()} | ${
              w.alias || (await lookUpDomains(w.address))
            } | $${formatUsdDigit(w.net_worth.toString())}`,
          }
        }),
    )

    await i.respond(options).catch(() => null)
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
