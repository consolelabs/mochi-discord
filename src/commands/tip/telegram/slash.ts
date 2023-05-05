import { CommandInteraction } from "discord.js"
import { tipTelegram } from "./processor"

const run = async (i: CommandInteraction, args: string[]) => {
  return await tipTelegram(i, args)
}
export default run
