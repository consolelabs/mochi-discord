import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { run } from "./processor"
import config from "adapters/config"
import profile from "adapters/profile"
import mochiPay from "adapters/mochi-pay"

const command: SlashCommand = {
  name: "view",
  category: "Config",
  // onlyAdministrator: true,
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("view")
      .setDescription("View config of a trading vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
          .setAutocomplete(true),
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    // const data = await config.vaultList(i.guildId, true)

    const userProfile = await profile.getByDiscord(i.user.id)
    const [spotVaults, tradingVaults] = await Promise.all([
      config.vaultList(i.guildId, true),
      mochiPay.listEarningVaults(userProfile.id),
    ])

    const options = [
      ...spotVaults
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((d: any) => ({ name: d.name, value: `spot_${d.id}` })),
      ...tradingVaults
        .filter((v: any) =>
          v.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((v: any) => ({ name: v.name, value: `trading_${v.id}` })),
    ]

    await i.respond(options)
  },
  run: async function (interaction: CommandInteraction) {
    const arg = interaction.options.getString("name", true)
    const [vaultType, vaultId] = arg.split("_", 2)
    return run({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
      vaultId,
      vaultType,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault config key <api_key> <secret_key>`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
