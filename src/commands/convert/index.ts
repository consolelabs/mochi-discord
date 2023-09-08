import { SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import convertSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const slashCmd: SlashCommand = {
  name: "convert",
  category: "Defi",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("convert")
      .setDescription("Convert token to another token")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount of your token")
          .setRequired(true),
      )
      .addStringOption((option) => {
        const o = option
          .setName("from")
          .setDescription("Token you want to convert")
          .setRequired(true)
        return o
      })
      .addStringOption((option) => {
        const o = option
          .setName("to")
          .setDescription("Token you want to convert to")
          .setRequired(true)
        return o
      })

    return data
  },
  run: async function (i) {
    return await convertSlash(i)
  },
  help: () =>
    Promise.resolve({
      embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
    }),
  colorType: "Defi",
}

export default { slashCmd }
