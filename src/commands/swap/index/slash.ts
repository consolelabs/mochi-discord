import { CommandInteraction } from "discord.js"
import { render } from "./processor"

export default async function run(
  i: CommandInteraction,
  data: any,
  from: string,
  to: string,
  chainName: string
) {
  await render(i, data, from, to, chainName)
}
