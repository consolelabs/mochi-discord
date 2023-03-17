import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { Command, SlashCommand } from "types/common"
import { SlashCommandBuilder } from "@discordjs/builders"
import { composeEmbedMessage } from "ui/discord/embed"
import { PREFIX } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import { APIError, CommandArgumentError, InternalError } from "errors"
import { CommandInteraction, Message } from "discord.js"
import gameStore from "adapters/game-store"
import { handleDetail, handleList } from "./index/text"
import {
  handleDetail as handleDetailSlash,
  handleList as handleListSlash,
} from "./index/slash"
dayjs.extend(utc)

async function getHelpMessage(msg: Message) {
  return {
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}game\n${PREFIX}game <game_id>`,
        footer: [`Type ${PREFIX}help game for a specific action!`],
        description: "Show featured games",
        examples: `${PREFIX}game\n${PREFIX}game 1`,
        includeCommandsList: true,
      }),
    ],
  }
}

const textCmd: Command = {
  id: "game",
  command: "game",
  category: "Game",
  brief: "Featured games",
  run: async (msg) => {
    const [, _gameId] = getCommandArguments(msg)
    const gameId = Number(_gameId)

    if (!gameId) {
      const games = await gameStore.listGames()
      if (!games.ok) {
        throw new APIError({
          curl: games.curl,
          msgOrInteraction: msg,
          description: games.log,
        })
      }
      return handleList(games.data as Array<any>, msg)
    } else {
      if (Number.isNaN(gameId) || Math.abs(gameId) === Infinity) {
        throw new CommandArgumentError({
          message: msg,
          getHelpMessage: () => getHelpMessage(msg),
        })
      }

      const detail = await gameStore.gameDetail(gameId)
      if (!detail.ok) {
        if (detail.error.toLowerCase() === "notfound") {
          throw new InternalError({
            description: "The game you were looking for cannot be found.",
            msgOrInteraction: msg,
          })
        }
        throw new APIError({
          curl: detail.curl,
          msgOrInteraction: msg,
          description: detail.log,
        })
      }

      return handleDetail(detail.data, msg)
    }
  },
  getHelpMessage,
  allowDM: true,
  colorType: "Game",
  canRunWithoutAction: true,
  aliases: ["games"],
}

const slashCmd: SlashCommand = {
  name: "game",
  category: "Game",
  prepare: () => {
    const data = new SlashCommandBuilder()
      .setName("game")
      .setDescription("View featured games")

    data.addNumberOption((option) =>
      option
        .setName("game_id")
        .setDescription("The game ID in number")
        .setMinValue(1)
        .setRequired(false)
    )

    return data
  },
  run: async (interaction: CommandInteraction) => {
    const gameId = interaction.options.getNumber("game_id")
    if (!gameId) {
      const games = await gameStore.listGames()
      if (!games.ok) {
        throw new APIError({
          curl: games.curl,
          msgOrInteraction: interaction,
          description: games.log,
        })
      }
      return handleListSlash(games.data as Array<any>, interaction)
    } else {
      const detail = await gameStore.gameDetail(gameId)
      if (!detail.ok) {
        if (detail.error.toLowerCase() === "notfound") {
          throw new InternalError({
            description: "The game you were looking for cannot be found.",
            msgOrInteraction: interaction,
          })
        }
        throw new APIError({
          curl: detail.curl,
          msgOrInteraction: interaction,
          description: detail.log,
        })
      }

      return handleDetailSlash(detail.data, interaction)
    }
  },
  help: async () => ({
    embeds: [
      composeEmbedMessage(null, {
        usage: `${PREFIX}game\n${PREFIX}game <game_id>`,
        footer: [`Type ${PREFIX}help game for a specific action!`],
        description: "Show featured games",
        examples: `${PREFIX}game\n${PREFIX}game 1`,
        includeCommandsList: true,
      }),
    ],
  }),
  colorType: "Game",
}

export default { textCmd, slashCmd }
