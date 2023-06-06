import { CommandInteraction } from "discord.js"
import * as processor from "./processor"

export const run = (i: CommandInteraction, tokenSymbol: string) =>
  processor.deposit(i, tokenSymbol)

export default run
