import { CommandInteraction } from "discord.js"
import { render } from "./processor"

const run = (i: CommandInteraction) => render(i)

export default run
