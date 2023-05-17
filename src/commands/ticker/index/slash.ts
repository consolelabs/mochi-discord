import { CommandInteraction } from "discord.js"
import { SlashCommandResponse } from "types/common"
import { ticker } from "./processor"

async function run(
  interaction: CommandInteraction,
  baseQ: string,
  chain?: string
): Promise<SlashCommandResponse> {
  return await ticker(interaction, baseQ, chain ?? "")
}

export default run
