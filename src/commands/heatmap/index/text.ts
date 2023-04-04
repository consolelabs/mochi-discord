import { Message } from "discord.js"
import { heatmap } from "./processor"

const run = async (msg: Message) => {
  // msg.reply({ embeds: [embed] })
  return await heatmap(msg)
}

export default run
