import { Embed, SlashCommandBuilder } from "@discordjs/builders"
import api from "api"
import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import mochiAPI from "../../adapters/mochi-api"
import profile from "../../adapters/profile"
import { chunk } from "lodash"
import { MessageEmbed } from "discord.js"

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

    const { text } = await UI.components.changelog({
      title: changelog.title,
      content: changelog.content,
      on: Platform.Discord,
    })
    let sections = text.split("<br>")
    let embeds: MessageEmbed[] = []
    for (const section of sections) {
      const embed = new MessageEmbed()
      const regexp = /\[\.\]\((.*?)\)/g
      const matches = section.matchAll(regexp)
      for (const match of matches) {
        console.log(match[1])
        embed.image = { url: match[1] }
      }
      embed.description = section
      embeds.push(embed)
    }
    await i.editReply({ embeds })

    return null
  },
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Server",
}

export default { slashCmd }
