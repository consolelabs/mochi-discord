import { SlashCommandBuilder } from "@discordjs/builders"
import api from "api"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import mochiAPI from "adapters/mochi-api"
import profile from "adapters/profile"
import { HOMEPAGE_URL } from "utils/constants"
import { ButtonInteraction, Message } from "discord.js"
import { getAuthor, getEmojiURL, emojis } from "utils/common"
import { NEKO_SAN_ID } from "env"
import { APIError } from "../../errors"

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

    const dataProfile = await profile.getByDiscord(i?.member?.user.id ?? "")
    if (dataProfile.error) {
      return
    }

    const views = await mochiAPI.createChangelogViews(
      dataProfile.id,
      changelog.title,
    )
    if (!views.ok) {
      return
    }

    const { text, images } = await UI.components.changelog({
      title: changelog.title,
      content: changelog.content,
      on: Platform.Discord,
    })
    const footer = `\⎯⎯⎯⎯⎯\nView all changelogs on [Mochi web](${HOMEPAGE_URL}/changelog/${changelog.version})`
    let embed = composeEmbedMessage(null, {
      description: `${text}\n${footer}`,
    })
    if (images.length > 0) {
      embed.setImage(images[0])
    }

    await i.editReply({ embeds: [embed] })

    return null
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }

export async function handleConfirmPublicChangelog(i: ButtonInteraction) {
  const args = i.customId.split("_")
  const changelogName = args[3]

  const author = getAuthor(i)
  if (author.id != NEKO_SAN_ID) {
    return
  }

  const data = await mochiAPI.publicChangelog(changelogName, true)
  if (!data.ok) {
    throw new APIError({
      msgOrInteraction: i,
      description: "Cannot publish changelog",
      curl: data.curl,
      error: data.error ?? "",
      status: data.status ?? 500,
    })
  }

  const { message } = <{ message: Message }>i

  await i.update({
    embeds: [
      composeEmbedMessage(message, {
        author: ["Publish Changelog successfully", getEmojiURL(emojis.APPROVE)],
        description: `You published the new changelog`,
      }),
    ],
    components: [],
  })

  return
}

export async function handleCancelPublicChangelog(i: ButtonInteraction) {
  const author = getAuthor(i)
  if (author.id != NEKO_SAN_ID) {
    return
  }

  const { message } = <{ message: Message }>i

  await i.update({
    embeds: [
      composeEmbedMessage(message, {
        author: ["Unpublished Changelog", getEmojiURL(emojis.REVOKE)],
        description: `You haven't published the new changelog`,
      }),
    ],
    components: [],
  })

  return
}
