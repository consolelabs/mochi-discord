import { CommandInteraction } from "discord.js"
import { handleTip } from "./processor"
import { getErrorEmbed } from "discord/embed/ui"

const run = async (interaction: CommandInteraction) => {
  const users = interaction.options.getString("users")?.trimEnd()
  const amount = interaction.options.getNumber("amount")
  const token = interaction.options.getString("token")
  const isEach = interaction.options.getBoolean("each") ?? false
  const message = interaction.options.getString("message")

  if (!users || !amount || !token) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "Missing arguments",
          }),
        ],
      },
    }
  }
  let args = users.split(" ")
  let fullCmd = `/tip ${users} ${amount} ${token}`
  args.push(amount.toString(), token)
  if (isEach) args.push("each")
  if (message) {
    fullCmd += ` "${message}"`
    args = args.concat(`"${message}"`.split(" "))
  }
  args.unshift("tip")
  return {
    messageOptions: {
      ...(await handleTip(args, interaction.user.id, fullCmd, interaction)),
    },
  }
}
export default run
