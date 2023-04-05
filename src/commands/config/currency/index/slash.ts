import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { pascalCase } from "change-case"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { emojis, getEmojiURL, msgColors } from "utils/common"
import { set } from "./processor"

const choices = ["FTM", "ETH", "CAKE", "BTC", "SOL"]

const slashCmd: SlashCommand = {
  name: "currency",
  category: "Config",
  prepare: () => {
    const data = new SlashCommandSubcommandBuilder()
      .setName("currency")
      .setDescription("Config default currency for this server")
      .addStringOption((opt) =>
        opt
          .setName("name")
          .setDescription("select currency")
          .setRequired(true)
          .addChoices(choices.map((c) => [c, c.toLowerCase()]))
      )

    return data
  },
  run: async function (i) {
    const name = i.options.getString("name", true)

    const { was, now } = await set(i, name)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            thumbnail: getEmojiURL(emojis.CONFIG),
            author: [
              "Your currency has changed successfully",
              getEmojiURL(emojis.CHECK),
            ],
            title:
              was && now
                ? `**${was.symbol.toUpperCase()} → ${now.symbol.toUpperCase()}**`
                : `The default currency is now ${name}`,
            description:
              was && now
                ? `${pascalCase(was.name)} changed to ${pascalCase(now.name)}`
                : "",
            color: msgColors.SUCCESS,
          }),
        ],
      },
    }
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default slashCmd
