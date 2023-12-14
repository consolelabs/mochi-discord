import { SlashCommandBuilder } from "@discordjs/builders"
import api from "api"
import { SlashCommand } from "types/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import Discord from "discord.js"

const slashCmd: SlashCommand = {
  name: "changelog",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("changelog")
      .setDescription("Check what's new with Mochi")
    return data
  },
  run: async function (i) {
    const changelog = api.getLatestChangelog()
    if (!changelog) {
      return {
        messageOptions: {
          content: "👌 You're all caught up!",
        },
      }
    }
    const { text, images } = await UI.components.changelog({
      title: changelog.title,
      content: changelog.content,
      on: Platform.Discord,
    })

    await i.editReply({
      embeds: [
        composeEmbedMessage2(i, {
          author: ["\u200b", thumbnails.MOCHI],
          description: text,
        }),
      ],
    })

    if (images.length) {
      return {
        messageOptions: {
          files: images.map((i) => new Discord.MessageAttachment(i, i)),
        },
      }
    }

    return null
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
