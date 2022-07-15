import { createCanvas, loadImage } from "canvas"
import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeNameDescriptionList,
} from "utils/discordEmbed"

const size = 200

export async function composeQuestListEmbed(msg: Message) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")
  const avatar = msg.author.displayAvatarURL({ format: "jpeg" })
  ctx.drawImage(await loadImage(avatar), 0, 0, size, size)
  const shard = await loadImage(
    "https://cdn.discordapp.com/attachments/984660970624409630/992012075951984650/scarlet-shard.png"
  )

  ctx.fillStyle = "#1d475f"
  ctx.beginPath()
  ctx.moveTo(size + 60, 0)
  ctx.lineTo(0, size + 60)
  ctx.lineTo(size + 60, size + 60)
  ctx.fill()
  ctx.drawImage(shard, size / 3, size / 3, size, size)

  const img = canvas.toBuffer()
  const embed = composeEmbedMessage(msg, {
    title: "Tripod - your daily quests",
  })
    .setDescription(
      composeNameDescriptionList([
        { name: "[Easy] - a", description: "easy quest" },
        { name: "[Medium] - b", description: "medium quest" },
        { name: "[Hard] - c", description: "hard quest" },
      ])
    )
    .setThumbnail("attachment://img.jpeg")

  return {
    messageOptions: {
      embeds: [embed],
      files: [new MessageAttachment(img, "img.jpeg")],
    },
  }
}

const command: Command = {
  id: "tripod_quests",
  command: "daily",
  brief: "See Tripod's daily quests",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    const msgOpts = await composeQuestListEmbed(msg)
    await msg.reply(msgOpts.messageOptions)

    return {
      messageOptions: null,
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tripod daily`,
        examples: `${PREFIX}tokens daily`,
      }),
    ],
  }),
}

export default command
