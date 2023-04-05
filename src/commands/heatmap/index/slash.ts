import { CommandInteraction } from "discord.js"
import { heatmap } from "./processor"

const run = async (i: CommandInteraction) => {
  return await heatmap(i)
}

export default run
