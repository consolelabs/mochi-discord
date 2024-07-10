import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction, Message } from "discord.js"
import { SlashCommand } from "types/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { runVaultList } from "./processor"
import { route } from "utils/router"
import { machineConfig } from "commands/vault/info/slash"

const command: SlashCommand = {
  name: "list",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("list")
      .setDescription("Show current vault")
  },
  run: async function (interaction: CommandInteraction) {
    const { msgOpts } = await runVaultList(interaction)
    const reply = (await interaction.editReply(msgOpts)) as Message

    route(
      reply,
      interaction,
      machineConfig("vaultList", "", { fromVaultList: true }),
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}vault list`,
        examples: `${SLASH_PREFIX}vault list`,
        document: `${GM_GITBOOK}&action=streak`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
