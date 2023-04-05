import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, SLASH_PREFIX } from "utils/constants"
import { emojis, getAuthor, getEmojiURL } from "../../utils/common"
import run from "./index/text"
import { CommandInteraction } from "discord.js"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "heatmap",
  command: "heatmap",
  brief: "Show top cryptocurrencies with live prices and 24h change in price",
  category: "Defi",
  run,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        author: ["Heatmap Crypto", getEmojiURL(emojis.MOCHI_CIRCLE)],
        usage: `${PREFIX}heatmap`,
      }),
    ],
  }),
  colorType: "Market",
  canRunWithoutAction: true,
  allowDM: true,
}

const slashCmd: SlashCommand = {
  name: "heatmap",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("heatmap")
      .setDescription(
        "Show top cryptocurrencies with live prices and 24h change in price"
      )
  },
  run,
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}heatmap`,
        originalMsgAuthor: getAuthor(interaction),
      }),
    ],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
