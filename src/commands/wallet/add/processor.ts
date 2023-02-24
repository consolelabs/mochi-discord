import defi from "adapters/defi"
import {
  ButtonInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { MessageButtonStyles } from "discord.js/typings/enums"
import { APIError, InternalError, OriginalMessage } from "errors"
import { getSuccessEmbed } from "ui/discord/embed"
import { getEmoji, isAddress } from "utils/common"
import { viewWalletDetails } from "../view/processor"

export async function trackWallet(
  msg: OriginalMessage,
  author: User,
  address: string,
  alias: string
) {
  const { valid, type } = isAddress(address)
  if (!valid) {
    throw new InternalError({
      message: msg,
      title: "Invalid address",
      description:
        "Your wallet address is invalid. Make sure that the wallet address is valid, you can copy-paste it to ensure the exactness of it.",
    })
  }
  const { ok, log, curl, status } = await defi.trackWallet({
    userId: author.id,
    address,
    alias,
    type,
  })
  const pointingright = getEmoji("pointingright")
  if (!ok && status === 409) {
    throw new InternalError({
      message: msg,
      title: "Alias has been used",
      description: `This alias has been used for another address. Please enter another alias!\n${pointingright} You can see used aliases by using \`$wallet view\`.`,
    })
  }
  if (!ok) {
    throw new APIError({ message: msg, description: log, curl })
  }
  const embed = getSuccessEmbed({
    title: "Successfully track the wallet address",
    description: `${pointingright} Now, you can track this wallet balance by using \`$wallet view <address>/<alias>\`.`,
  })
  return {
    messageOptions: {
      embeds: [embed],
      components: [composeViewWaletButtonRow(address)],
    },
    buttonCollector: { handler: viewWallet },
  }
}

async function viewWallet(i: ButtonInteraction) {
  if (!i.customId.startsWith("wallet_view_details")) return
  const address = i.customId.split("-")[1]
  return await viewWalletDetails(i.message as Message, i.user, address)
}

function composeViewWaletButtonRow(address: string) {
  return new MessageActionRow().addComponents(
    new MessageButton({
      style: MessageButtonStyles.SUCCESS,
      label: "View wallet",
      customId: `wallet_view_details-${address}`,
      emoji: getEmoji("wallet"),
    })
  )
}
