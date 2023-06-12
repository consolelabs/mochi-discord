import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { LOG_CHANNEL_GITBOOK, SLASH_PREFIX } from "utils/constants"

import { SlashCommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import settingSlash from "./slash"

const slashCmd: SlashCommand = {
  name: "setting",
  category: "Config",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("setting")
      .setDescription("Setup for your guild")
  },
  run: async function (interaction: CommandInteraction) {
    await settingSlash(interaction)
    return null
  },
  help: () =>
    Promise.resolve({
      embeds: [
        composeEmbedMessage(null, {
          includeCommandsList: true,
          usage: `${SLASH_PREFIX}setting`,
          description: "Setup for your guild and your member",
          footer: [`Type ${SLASH_PREFIX}help setting`],
          document: LOG_CHANNEL_GITBOOK,
          title: "Setting",
          examples: `${SLASH_PREFIX}setting`,
        }),
      ],
    }),
  colorType: "Server",
}

export default { slashCmd }
