import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand, embedsColors } from "types/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import get from "./processor"
import { TokenEmojiKey, getEmojiToken, thumbnails } from "utils/common"

const command: SlashCommand = {
  name: "info",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("info")
      .setDescription("View list default ticker for your guild")
  },
  run: async function (interaction: CommandInteraction) {
    const cfgs = await get(interaction)
    const output = formatDataTable(cfgs, {
      cols: ["query", "default_ticker"],
      alignment: ["left", "right"],
      rowAfterFormatter: (formatted, i) =>
        `${getEmojiToken(cfgs[i].query as TokenEmojiKey, false)} ${formatted}`,
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            color: embedsColors.Server,
            author: [
              "Default Ticker Info",
              "https://cdn.discordapp.com/emojis/1090477901725577287.webp?size=240&quality=lossless",
            ],
            thumbnail: thumbnails.TOKENS,
            description: output.joined,
          }),
        ],
      },
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${SLASH_PREFIX}default ticker info`,
        examples: `${SLASH_PREFIX}default ticker info`,
        document: `${GM_GITBOOK}&action=default`,
      }),
    ],
  }),
  colorType: "Server",
}

export default command
