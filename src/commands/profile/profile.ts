import { Message, SelectMenuInteraction, User } from "discord.js"
import { InvalidInputError } from "errors"
import { CommandChoiceHandler } from "utils/CommandChoiceManager"
import { isInteraction } from "utils/discord"
import walletAssetAllocation from "./wallet-asset-allocation"

const choices: Record<string, (user: User, msg: Message) => Promise<any>> = {
  "1": walletAssetAllocation,
  profile_wallet_asset_allocation: walletAssetAllocation,
}

const handler: CommandChoiceHandler = async (msgOrInteraction) => {
  let input
  if (!isInteraction(msgOrInteraction)) {
    input = msgOrInteraction.content.trim()
    if (!Object.keys(choices).includes(input)) {
      throw new InvalidInputError({ message: msgOrInteraction })
    }
  } else {
    input = (msgOrInteraction as SelectMenuInteraction).values[0]
  }

  const choice = choices[input]
  if (!choice) {
    throw new InvalidInputError({
      message: isInteraction(msgOrInteraction)
        ? (msgOrInteraction.message as Message)
        : msgOrInteraction,
    })
  }
  const messageOptions = await choice(
    isInteraction(msgOrInteraction)
      ? msgOrInteraction.user
      : msgOrInteraction.author,
    isInteraction(msgOrInteraction)
      ? (msgOrInteraction.message as Message)
      : msgOrInteraction
  )

  return messageOptions
}

export default handler
