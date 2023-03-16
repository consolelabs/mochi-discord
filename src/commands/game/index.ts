import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { Command, SlashCommand } from "types/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { toEmbed } from "commands/new-nft/processor"
import { handle } from "./index/processor"
dayjs.extend(utc)

const textCmd: Command = {
  id: "game",
  command: "game",
  category: "Game",
  brief: "Featured games",
  run: async (msg) => {
    return await handle(msg)
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}nft <collection_symbol> <token_id>\n${PREFIX}nft <action>`,
        footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
        description:
          "Show NFT rarity checker in real-time, including volume, ticker, and sales",
        examples: `${PREFIX}nft list\n${PREFIX}nft MUTCATS 1\n${PREFIX}mochi bayc 1`,
        includeCommandsList: true,
      }),
    ],
  }),
  allowDM: true,
  colorType: "Game",
  canRunWithoutAction: true,
}

const slashCmd: SlashCommand = {
  name: "game",
  category: "Game",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("game")
      .setDescription("View featured games")

    return data
  },
  run: async function () {
    return toEmbed(null, {})
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}nft <collection_symbol> <token_id>\n${PREFIX}nft <action>`,
        footer: [`Type ${PREFIX}help nft <action> for a specific action!`],
        description:
          "Show NFT rarity checker in real-time, including volume, ticker, and sales",
        examples: `${PREFIX}nft list\n${PREFIX}nft MUTCATS 1\n${PREFIX}mochi bayc 1`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Command",
}

export default { textCmd, slashCmd }
