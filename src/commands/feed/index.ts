import { SlashCommandBuilder } from "@discordjs/builders"
import { SlashCommand } from "types/common"
import api from "api"
import UI, { Platform } from "@consolelabs/mochi-formatter"
import { composeEmbedMessage2 } from "ui/discord/embed"
import { getEmoji, thumbnails } from "utils/common"

const slashCmd: SlashCommand = {
  name: "feed",
  category: "Defi",
  prepare: (aliasName = "feed") => {
    return new SlashCommandBuilder()
      .setName(aliasName)
      .setDescription("See the global tipfeed")
  },
  run: async function (i) {
    const { ok, data } = await api.pay.transactions.getAll({
      page: 0,
      size: 10,
      action: ["transfer", "vault_transfer"],
    })
    if (!ok) {
      throw new Error("Cannot get transactions")
    }

    const { length, text } = await UI.components.txns({
      txns: data,
      withTitle: false,
      on: Platform.Discord,
      groupDate: true,
      global: true,
    })

    const embed = composeEmbedMessage2(i, {
      author: ["Latest tips", thumbnails.MOCHI],
      description: [
        `${getEmoji(
          "ANIMATED_POINTING_DOWN",
        )} This is the ${length} latest transactions on mochi.gg`,
        getEmoji("BLANK"),
        text,
      ].join("\n"),
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
