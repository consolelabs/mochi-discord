import { SlashCommandBuilder } from "@discordjs/builders"
import api from "api"
import { SlashCommand } from "types/common"
import { composeEmbedMessage, composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"
import UI, { Platform } from "@consolelabs/mochi-ui"
import Discord from "discord.js"

const slashCmd: SlashCommand = {
  name: "sup",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("sup")
      .setDescription("Check what's new with Mochi")
    return data
  },
  run: async function (i) {
    const { ok, data: profile } = await api.profile.discord.getById({
      discordId: i.user.id,
    })
    if (!ok)
      return {
        messageOptions: {
          content: "Cannot show changelogs",
        },
      }
    const { changelog, markRead } = await api.getLatestChangelog(profile.id)
    if (!changelog) {
      return {
        messageOptions: {
          content: "👌 You're all caught up!",
        },
      }
    }
    const { text, images } = await UI.components.changelog({
      content: changelog.content,
      on: Platform.Discord,
    })

    await i.editReply({
      embeds: [
        composeEmbedMessage2(i, {
          author: ["Changelog", thumbnails.MOCHI],
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

    markRead()

    return null
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
