import { SlashCommandBuilder } from "@discordjs/builders"
import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"
import { SlashCommand } from "types/common"
import {
  composeEmbedMessage,
  composeEmbedMessage2,
  enableDMMessage,
} from "ui/discord/embed"
import { emojis, getEmojiURL, msgColors, thumbnails } from "utils/common"

const slashCmd: SlashCommand = {
  name: "tagme",
  category: "Community",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("tagme")
      .setDescription("Get a DM whenever someone mentions you")

    return data
  },
  run: async function (i) {
    if (!i.guild?.id) {
      throw new GuildIdNotFoundError({ message: i })
    }

    const {
      ok,
      curl,
      log,
      status = 500,
    } = await community.upsertTagme({
      userId: i.user.id,
      guildId: i.guild.id,
      isActive: true,
    })

    if (!ok) {
      throw new APIError({
        msgOrInteraction: i,
        curl,
        description: log,
        status,
      })
    }

    const dm = {
      embeds: [
        composeEmbedMessage2(i, {
          author: ["Hey there", thumbnails.MOCHI],
          thumbnail: getEmojiURL(emojis.WAVING_HAND),
          description: `Whenever someone mentions you in **${i.guild.name}**, Mochi will DM to let you know\n\nYou can always unsubcribe at any time.`,
          color: msgColors.SUCCESS,
        }),
      ],
    }

    try {
      const msg = await i.user.send(dm)
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage2(i, {
              author: ["You're setup", thumbnails.MOCHI],
              thumbnail: getEmojiURL(emojis.WAVING_HAND),
              description: `**[Check your DM!](${msg.url})**`,
              color: msgColors.ACTIVITY,
            }),
          ],
        },
      }
    } catch (e) {
      return {
        messageOptions: {
          embeds: [enableDMMessage("You're subscribed but ")],
        },
      }
    }
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
  ephemeral: true,
}

export default { slashCmd }
