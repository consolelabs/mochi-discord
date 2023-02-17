import { composeEmbedMessage2, getErrorEmbed } from "ui/discord/embed"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand } from "types/common"
import { SLASH_PREFIX } from "utils/constants"
import { GuildIdNotFoundError, InternalError } from "errors"
import { getEmoji } from "utils/common"
import { handle } from "./processor"

const command: SlashCommand = {
  name: "track",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("track")
      .setDescription("Set up a tracker of proposal voting rounds on Snapshot.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("channel to log proposals. Example: #general")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("url")
          .setDescription(
            "snapshot URL or DAO space. Example: https://snapshot.org/#/bitdao.eth"
          )
          .setRequired(true)
      )
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }
    const channel = interaction.options.getChannel("channel")
    const url = interaction.options.getString("url")
    if (!channel || !url) {
      throw new InternalError({
        description: "Missing arguments",
      })
    }
    if (channel.type !== "GUILD_TEXT") {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Invalid channel",
              description: `Please choose a text channel`,
            }),
          ],
        },
      }
    }
    return await handle(interaction, channel.id, url, interaction.guildId)
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        title: "Set up a tracker of proposal voting rounds on Snapshot and Commonwealth.",
        usage: `${SLASH_PREFIX}proposal track #channel <snapshot_DAO_link>\n${SLASH_PREFIX}proposal track #channel <commonwealth_link>`,
        description: `${getEmoji(
          "pointingright"
        )} Manage to post proposals and the voting space.\n${getEmoji(
          "pointingright"
        )} Receive the notification when proposals are opened for voting on [Snapshot](https://snapshot.org/#/) or [Commonwealth](https://commonwealth.im/).`,
        examples: `${SLASH_PREFIX}proposal track #general https://snapshot.org/#/bitdao.eth\n${SLASH_PREFIX}proposal track #general https://commonwealth.im/osmosis/discussion`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
