import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"
import { SlashCommand, embedsColors } from "types/common"
import { GM_GITBOOK, SLASH_PREFIX } from "utils/constants"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import get from "./processor"
import {
  TokenEmojiKey,
  getEmoji,
  getEmojiToken,
  thumbnails,
} from "utils/common"
import { getSlashCommand } from "utils/commands"

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

    if (cfgs.length === 0) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(null, {
              color: embedsColors.Server,
              description: `You haven't set any default ticker yet. \n\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true,
              )} To set a new one, run ${await getSlashCommand(
                "default ticker set",
              )}.\n${getEmoji(
                "ANIMATED_POINTING_RIGHT",
                true,
              )} To view all available default ticker, run ${await getSlashCommand(
                "default ticker info",
              )}.`,
            }),
          ],
        },
      }
    }

    const output = formatDataTable(
      cfgs.map((cfg) => {
        return {
          query: cfg.query.toUpperCase(),
          default_ticker: cfg.default_ticker,
        }
      }),
      {
        cols: ["query", "default_ticker"],
        alignment: ["left", "right"],
        rowAfterFormatter: (formatted, i) =>
          `${getEmojiToken(
            cfgs[i].query as TokenEmojiKey,
            false,
          )} ${formatted}`,
      },
    )

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
