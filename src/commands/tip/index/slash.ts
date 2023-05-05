import { CommandInteraction } from "discord.js"
import { tip } from "./processor"

const run = async (i: CommandInteraction, args: string[]) => {
  return await tip(i, args)
}
export default run
