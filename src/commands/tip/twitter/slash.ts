import { CommandInteraction } from "discord.js"
import { tipTwitter } from "./processor"

const run = async (i: CommandInteraction, args: string[]) => {
  return await tipTwitter(i, args)
}
export default run
