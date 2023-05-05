import { CommandInteraction } from "discord.js"
import { tipMail } from "./processor"

const run = async (i: CommandInteraction, args: string[]) => {
  return await tipMail(i, args)
}
export default run
