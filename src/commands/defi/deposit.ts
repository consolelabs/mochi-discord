import { Command } from "types/common"
import { CommandInteraction, Message, User } from "discord.js"
import { DEPOSIT_GITBOOK, PREFIX, DEFI_DEFAULT_FOOTER } from "utils/constants"
import { DirectMessageNotAllowedError } from "errors"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"
import { APIError } from "errors"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"

export async function handleDeposit(
  msg: Message | CommandInteraction,
  user: User,
  tokenSymbol: string
) {
  try {
    const res = await defi.offchainTipBotAssignContract({
      user_id: user.id,
      token_symbol: tokenSymbol,
    })

    if (!res.ok) {
      throw new APIError({ message: msg, curl: res.curl, description: res.log })
    }

    const dm = await user.send({
      embeds: [
        composeEmbedMessage(null, {
          author: [
            `Deposit ${tokenSymbol.toUpperCase()}`,
            getEmojiURL(emojis.WALLET),
          ],
          description: `Below is the wallet address linked to your Discord account.
          Please deposit to the following address only ${getEmoji(
            "ok1"
          )}.\n\n**Your deposit address**\n\`\`\`${
            res.data.contract.contract_address
          }\`\`\``,
        }),
      ],
    })

    if (msg.channel?.type === "DM") return null

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${user}, your deposit address has been sent to you. Check your DM!`,
          }),
        ],
        components: [composeButtonLink("See the DM", dm.url)],
      },
    }
  } catch (e: any) {
    if (msg.channel?.type !== "DM" && e.httpStatus === 403) {
      throw new DirectMessageNotAllowedError({ message: msg })
    }
    throw e
  }
}

const command: Command = {
  id: "deposit",
  command: "deposit",
  brief: "Deposit",
  category: "Defi",
  run: async function (msg: Message) {
    const res = getCommandArguments(msg)
    if (res.length < 2) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    return await handleDeposit(msg, msg.author, res[1])
  },
  featured: {
    title: `${getEmoji("left_arrow")} Deposit`,
    description: "Deposit tokens into your in-discord wallet",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}deposit <currency>`,
        description: "Offchain deposit token",
        examples: `${PREFIX}deposit eth`,
        footer: [DEFI_DEFAULT_FOOTER],
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["dep"],
  allowDM: true,
  colorType: "Defi",
  minArguments: 2,
}

export default command
