import { CommandInteraction } from "discord.js"
import { render } from "./processor"

export default function run(
  i: CommandInteraction,
  data: any,
  from: string,
  to: string,
  chainName: string
) {
  render(i, data, from, to, chainName)
}
