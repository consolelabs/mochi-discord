import { Command, SlashCommand } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX, PROFILE_GITBOOK } from "utils/constants"
import convert from "./index/text"
import convertSlash from "./index/slash"
import { SlashCommandBuilder } from "@discordjs/builders"

const textCmd: Command = {
  id: "convert",
  command: "convert",
  brief: "Convert token to another token",
  category: "Defi",
  run: async function (msg) {
    return await convert(msg)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}convert`,
          usage: `${PREFIX}convert`,
          description: "Convert token to another token",
          footer: [`Type ${PREFIX}convert to convert token to another token`],
          document: PROFILE_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Defi",
}

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
          .setRequired(true)
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
  help: async () => ({
    embeds: [composeEmbedMessage(null, { includeCommandsList: true })],
  }),
  colorType: "Defi",
}

export default { textCmd, slashCmd }
