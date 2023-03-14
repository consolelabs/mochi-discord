import gameStore from "adapters/game-store"
import { Message, MessageActionRow, MessageButton } from "discord.js"
import { APIError } from "errors"
import { TextCommandResponse } from "types/common"
import { composeEmbedMessage } from "ui/discord/embed"
import { getCommandArguments } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX, VERTICAL_BAR } from "utils/constants"

export async function handle(msg: Message) {
  const [, gameId] = getCommandArguments(msg)
  if (!gameId) return handleList(msg)
  return handleDetail(gameId, msg)
}

async function handleDetail(
  gameId: string,
  msg: Message
): Promise<TextCommandResponse> {
  const detail = await gameStore.gameDetail(gameId)
  if (!detail.ok) {
    throw new APIError({
      curl: detail.curl,
      msgOrInteraction: msg,
      description: detail.log,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          color: "#FCD3C1",
          thumbnail:
            "https://cdn.discordapp.com/attachments/984660970624409630/1084830586536988802/game-controller.png",
          author: [detail.data.name, detail.data.icon],
          title: "Game Info",
          description: `${detail.data.description}.\n\nGenres ${detail.data.tags
            .map((t: string) => `\`${t}\``)
            .join(" ")}\n\n${getEmoji(
            "pointingright"
          )} Play game on Discord by typing the \`$play ${
            detail.data.id
          }\` command\n${getEmoji(
            "pointingright"
          )} Or click [\`play in browser\`](${
            detail.data.runner_url
          })\n${getEmoji("pointingright")} Track leaderboards \`$leaderboard ${
            detail.data.emoji
          }\``,
          image: detail.data.thumbnail,
        }),
      ],
    },
  }
}

async function handleList(msg: Message): Promise<TextCommandResponse> {
  const games = await gameStore.listGames()
  if (!games.ok) {
    throw new APIError({
      curl: games.curl,
      msgOrInteraction: msg,
      description: games.log,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          color: "#FCD3C1",
          thumbnail:
            "https://cdn.discordapp.com/attachments/984660970624409630/1084830586536988802/game-controller.png",
          footer: [`Select options below to explore featured games`],
          author: [
            "Games",
            "https://cdn.discordapp.com/attachments/984660970624409630/1084830586536988802/game-controller.png",
          ],
          title: "Latest Featured Games",
          description: `Play together, win together!\n${getEmoji(
            "pointingright"
          )}Play game by typing \`${PREFIX}play number\`\ne.g. $play 1 or click on "play"\n\n${(
            games.data as Array<any>
          )
            .map((g) => ({
              id: g.id,
              emoji: getEmoji(g.emoji),
              title: g.name,
              runner_url: g.runner_url?.trim(),
              server_url: g.join_server_url?.trim(),
            }))
            .map((game) => {
              let str = `${game.id} ${game.emoji} **${game.title}**`
              if (game.runner_url) {
                str += `  [\`play\`](${game.runner_url})`
              }
              if (game.server_url) {
                str += ` ${VERTICAL_BAR} [\`join server\`](${game.server_url})`
              }

              return str
            })
            .join("\n")}\n\n`,
        }),
      ],
      components: [
        new MessageActionRow().addComponents([
          new MessageButton()
            .setCustomId("game-featured")
            .setStyle("SECONDARY")
            .setEmoji("🎮")
            .setLabel("Featured")
            .setDisabled(true),
          new MessageButton()
            .setCustomId("game-discord-only")
            .setStyle("SECONDARY")
            .setEmoji("🎮")
            .setLabel("Discord Only"),
          new MessageButton()
            .setCustomId("game-all")
            .setStyle("SECONDARY")
            .setEmoji("🎮")
            .setLabel("All"),
          new MessageButton()
            .setCustomId("game-my-games")
            .setStyle("SECONDARY")
            .setEmoji("🎮")
            .setLabel("My Games"),
        ]),
      ],
    },
  }
}
