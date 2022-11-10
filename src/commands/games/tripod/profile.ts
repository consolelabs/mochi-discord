import { createCanvas, loadImage } from "canvas"
import { Message, MessageAttachment } from "discord.js"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import {
  composeEmbedMessage,
  composeSimpleSelection,
  getPaginationRow,
  listenForPaginateAction,
} from "utils/discordEmbed"
import humanId from "human-id"
import chunk from "lodash/chunk"
import { getEmoji } from "utils/common"

const size = 200
const pageSize = 8

async function composeProfile(msg: Message, pageIdx: number) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext("2d")
  const avatar = msg.author.displayAvatarURL({ format: "jpeg" })
  ctx.drawImage(await loadImage(avatar), 0, 0, size, size)
  const droid = await loadImage(
    "https://cdn.discordapp.com/attachments/984660970624409630/991983365567815720/droid.png"
  )

  ctx.fillStyle = "#1d475f"
  ctx.beginPath()
  ctx.moveTo(size + 60, 0)
  ctx.lineTo(0, size + 60)
  ctx.lineTo(size + 60, size + 60)
  ctx.fill()
  ctx.drawImage(droid, size / 2.2, size / 2.2, size, size)

  const img = canvas.toBuffer()

  const histories = new Array(20)
    .fill(null)
    .map(() => `${humanId({ separator: "-", capitalize: false })} - 2022/06/29`)

  const embed = composeEmbedMessage(msg, {
    title: "6428 is your highest Tripod point",
  })
    .setDescription(
      `History\n${composeSimpleSelection(
        chunk(histories, pageSize)[pageIdx],
        (o) => `${getEmoji("reply")} ${o}`
      )}`
    )
    .setThumbnail("attachment://img.jpeg")

  return {
    messageOptions: {
      embeds: [embed],
      files: [new MessageAttachment(img, "img.jpeg")],
      components: getPaginationRow(pageIdx, chunk(histories, pageSize).length),
    },
  }
}

const command: Command = {
  id: "tripod_profile",
  command: "profile",
  brief: "Check your Tripod profile",
  category: "Game",
  colorType: "Game",
  run: async function (msg) {
    const msgOpts = await composeProfile(msg, 0)
    const reply = await msg.reply(msgOpts.messageOptions)
    listenForPaginateAction(reply, msg, composeProfile)

    return null
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}tripod profile`,
        examples: `${PREFIX}tokens profile`,
      }),
    ],
  }),
}

export default command
