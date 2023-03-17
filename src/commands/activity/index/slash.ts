import { render } from "./processor"
import { CommandInteraction } from "discord.js"

const run = async (i: CommandInteraction) => {
  const userDiscordID = i.user.id
  return await render(userDiscordID)
}
export default run
