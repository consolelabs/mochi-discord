import { CommandInteraction } from "discord.js"
import { deposit } from "./processor"

export const run = async (i: CommandInteraction, tokenSymbol: string) =>
  deposit(i, tokenSymbol)

export default run
