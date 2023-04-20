import { CommandInteraction } from "discord.js"
import { render } from "./processor"

const run = async (i: CommandInteraction) => {
  return await render(i)
}

export default run
