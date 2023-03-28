import { CommandInteraction } from "discord.js"
import { SPACES_REGEX } from "utils/constants"
import { tip } from "./processor"

const run = async (i: CommandInteraction) => {
  const users = i.options.getString("users", true).split(SPACES_REGEX)
  const amount = i.options.getNumber("amount", true).toString()
  const token = i.options.getString("token", true)
  const each = (i.options.getString("each") || "") === "each" ? "each" : ""
  const message = `"${i.options.getString("message") ?? ""}"`

  const args = ["tip", ...users, amount, token, each, message].filter((s) =>
    Boolean(s)
  )
  return await tip(i, args)
}
export default run
