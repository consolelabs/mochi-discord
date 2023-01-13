import { CommandInteraction } from "discord.js"
import { handleBal } from "./processor"

const run = (i: CommandInteraction) => handleBal(i.user.id, i)
export default run
