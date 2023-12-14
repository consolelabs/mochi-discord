import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import api from "api"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { thumbnails } from "utils/common"

const slashCmd: SlashCommand = {
  name: "recap",
  category: "Defi",
  prepare: () => {
    return new SlashCommandBuilder()
      .setName("recap")
      .setDescription("Check monthly stats")
  },
  run: async function (i) {
    const { ok, data: profile } = await api.profile.discord.getById({
      discordId: i.user.id,
      noFetchAmount: true,
    })
    if (!ok) {
      throw new Error("Cannot get user profile")
    }
    const { title, text } = await UI.components.recap({
      api,
      on: Platform.Discord,
      profileId: profile.id,
    })

    const embed = composeEmbedMessage2(i, {
      author: [title, thumbnails.MOCHI],
      description: text,
    })

    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  },
  help: () => Promise.resolve({}),
  colorType: "Server",
}

export default { slashCmd }
