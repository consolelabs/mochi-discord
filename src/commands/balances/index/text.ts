import { Message } from "discord.js"
import { handleBal } from "./processor"

const run = async (msg: Message) => handleBal(msg.author.id, msg)
export default run
