import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runTransferTreasurer } from "./processor"
import config from "adapters/config"

const chains = {
  ethereum: "1",
  bnb: "56",
  fantom: "250",
  polygon: "137",
  solana: "999",
  base: "8453",
}

const command: SlashCommand = {
  name: "transfer",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("transfer")
      .setDescription("Transfer crypto from to wallet address")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter vault name")
          .setRequired(true)
          .setAutocomplete(true),
      )
      .addStringOption((option) => {
        const o = option
          .setName("chain")
          .setDescription("enter chain")
          .setRequired(true)
        Object.keys(chains).forEach((key) =>
          o.addChoice(key, chains[key as keyof typeof chains]),
        )
        return o
      })
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("enter token symbol")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("enter amount")
          .setRequired(true),
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("enter user").setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("enter message for user")
          .setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName("address")
          .setDescription("enter wallet address")
          .setRequired(false),
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    const data = await config.vaultList(i.guildId, true)

    await i.respond(
      data
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase()),
        )
        .map((d: any) => ({ name: d.name, value: d.name })),
    )
  },
  run: async function (interaction: CommandInteraction) {
    await runTransferTreasurer({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: (interaction: CommandInteraction) =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage2(interaction, {
          usage: `${SLASH_PREFIX}vault treasurer transfer <address> <chain> <symbol> <amount> <message>`,
          examples: `${SLASH_PREFIX}vault treasurer transfer 0x140... ftm usdc 100 hello`,
          document: `${GM_GITBOOK}&action=streak`,
        }),
      ],
    }),
  colorType: "Server",
}

export default command
