import { CommandInteraction, Message } from "discord.js"
import { heatmap } from "./processor"

const run = async (msgOrInteraction: Message | CommandInteraction) => {
  return await heatmap(msgOrInteraction)
}

export default run
