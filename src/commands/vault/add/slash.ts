import { CommandInteraction } from "discord.js"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { runAddTreasurer } from "./processor"
import config from "adapters/config"

const command: SlashCommand = {
  name: "add",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("add")
      .setDescription("Add treasurer to vault")
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("enter a vault name")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addUserOption((option) =>
        option.setName("user").setDescription("enter a user").setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("message")
          .setDescription("enter a message for user")
          .setRequired(false)
      )
  },
  autocomplete: async function (i) {
    if (!i.guildId) {
      await i.respond([])
      return
    }
    const focusedValue = i.options.getFocused()
    const { ok, data } = await config.vaultList(i.guildId)
    if (!ok) {
      await i.respond([])
      return
    }

    await i.respond(
      data
        .filter((d: any) =>
          d.name.toLowerCase().includes(focusedValue.toLowerCase())
        )
        .map((d: any) => ({ name: d.name, value: d.name }))
    )
  },
  run: async function (interaction: CommandInteraction) {
    return runAddTreasurer({
      i: interaction,
      guildId: interaction.guildId ?? undefined,
    })
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault treasurer add <vault_name> <user> <message>`,
        examples: `${SLASH_PREFIX}vault treasurer add vault1 @user1 hello`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
