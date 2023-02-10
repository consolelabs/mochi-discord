import defi from "adapters/defi"
import { Message } from "discord.js"
import { InternalError } from "errors"
import { getCommandArguments } from "utils/commands"
import { emojis, getEmojiURL } from "utils/common"
import { composeEmbedMessage } from "ui/discord/embed"
import * as processor from "./processor"
import { composeButtonLink } from "ui/discord/button"

const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  // $withdraw n <token>
  const amount = args[1]
  if (Number.isNaN(amount) || +amount <= 0) {
    throw new InternalError({
      message: msg,
      title: "Withdraw failed!",
      description: "amount must be a positive number",
    })
  }
  // check balance
  const invalidBalEmbed = await defi.getInsuffientBalanceEmbed(
    msg,
    msg.author.id,
    args[2],
    Number(args[1]),
    false
  )
  if (invalidBalEmbed) {
    return {
      messageOptions: {
        embeds: [invalidBalEmbed],
      },
    }
  }
  const dm = await msg.author.send({
    embeds: [
      composeEmbedMessage(msg, {
        author: ["Withdraw message", getEmojiURL(emojis.WALLET)],
        description: `Please enter your **${args[2].toUpperCase()}** destination address that you want to withdraw your tokens below.`,
      }),
    ],
  })

  if (msg.guildId !== null) {
    msg.reply({
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Withdraw tokens", getEmojiURL(emojis.WALLET)],
          description: `${msg.author}, a withdrawal message has been sent to you. Check your DM!`,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    })
  }
  args[3] = await processor.getDestinationAddress(msg, dm)
  await processor.withdraw(msg, args)

  return null
}
export default run
