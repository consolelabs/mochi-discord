import { MessageActionRow, MessageButton } from "discord.js"
import { getEmoji } from "utils/common"
import { PREFIX, VERTICAL_BAR } from "utils/constants"

export function getDetailEmbedOptions(data: Record<string, any>) {
  return {
    color: "#FCD3C1",
    thumbnail:
      "https://cdn.discordapp.com/attachments/984660970624409630/1084830586536988802/game-controller.png",
    author: [data.name, data.icon],
    title: "Game Info",
    description: `${data.description}.\n\nGenres ${data.tags
      .map((t: string) => `\`${t}\``)
      .join(" ")}\n\n${getEmoji(
      "pointingright"
    )} Play game on Discord by typing the \`$play ${
      data.id
    }\` command\n${getEmoji("pointingright")} Or click [\`play in browser\`](${
      data.runner_url
    })\n${getEmoji("pointingright")} Track leaderboards \`$leaderboard ${
      data.emoji
    }\``,
    image: data.thumbnail,
  }
}

export function getListEmbedOptions(data: Array<any>) {
  return {
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
    )}Play game by typing \`${PREFIX}play number\`\ne.g. $play 1 or click on "play"\n\n${data

      .map((g) => ({
        id: g.id,
        emoji: getEmoji(g.emoji),
        title: g.name,
        runner_url: g.runner_url?.trim(),
        server_url: g.join_server_url?.trim(),
      }))
      .map((game) => {
        let str = `\`${game.id}.\` ${game.emoji} **${game.title}**`
        if (game.runner_url) {
          str += `  [\`play\`](${game.runner_url})`
        }
        if (game.server_url) {
          str += ` ${VERTICAL_BAR} [\`join server\`](${game.server_url})`
        }

        return str
      })
      .join("\n")}\n\u200B\u200B`,
  }
}

export function getListComponents() {
  return [
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
        .setLabel("Discord Only")
        .setDisabled(true),
      new MessageButton()
        .setCustomId("game-all")
        .setStyle("SECONDARY")
        .setEmoji("🎮")
        .setLabel("All")
        .setDisabled(true),
      new MessageButton()
        .setCustomId("game-my-games")
        .setStyle("SECONDARY")
        .setEmoji("🎮")
        .setLabel("My Games")
        .setDisabled(true),
    ]),
  ]
}
