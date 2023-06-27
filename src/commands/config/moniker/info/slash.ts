import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import { HOMEPAGE_URL, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { getSlashCommand } from "utils/commands"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("Introduction about moniker command")
  },
  run: async () => {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Moniker Info", getEmojiURL(emojis.INFO_VAULT)],
            thumbnail: getEmojiURL(emojis.MONIKER),
            description: `Moniker can be understood as a nickname for your token. Instead of tipping or airdropping a token, you can create an item (cookie, beer,..) and tip or airdrop them to other users.\n\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Set up a new moniker configuration ${await getSlashCommand(
              "config moniker set"
            )}\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} See all moniker configurations ${await getSlashCommand(
              "config moniker list"
            )}\n${getEmoji(
              "ANIMATED_POINTING_RIGHT",
              true
            )} Remove a configured moniker ${await getSlashCommand(
              "config moniker remove"
            )}\n[Read insructions](${HOMEPAGE_URL}) for a complete setup guide`,
          }),
        ],
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}moniker info`,
        examples: `${SLASH_PREFIX}moniker info`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
