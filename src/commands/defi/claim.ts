import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

async function claim(msg: Message, args: string[]) {
  const [claimId, address] = args.slice(1)
  if (!+claimId) {
    throw new InternalError({
      message: msg,
      title: "Claiming failed!",
      description: "`claim ID` must be a number",
    })
  }
  const { data, ok, error, curl, log, status } =
    await defi.claimOnchainTransfer({
      claim_id: +claimId,
      address,
      user_id: msg.author.id,
    })
  if (!ok) {
    if (status === 404) {
      throw new InternalError({
        message: msg,
        title: "Claiming failed!",
        description:
          "Invalid `claim ID` or you already claimed the transaction.",
      })
    }
    throw new APIError({ message: msg, curl, description: log, error })
  }
  const {
    amount,
    symbol,
    amount_in_usd,
    tx_hash,
    tx_url,
    sender_id,
    recipient_address,
  } = data
  const embed = composeEmbedMessage(msg, {
    author: ["Transfer claimed!", getEmojiURL(emojis.WALLET)],
    description: `<@${
      msg.author.id
    }>, **${amount} ${symbol}** (≈ $${roundFloatNumber(
      amount_in_usd,
      4
    )}) has been successfully transferred to address\n\`${shortenHashOrAddress(
      recipient_address
    )}\`.\n**Sender:** <@${sender_id}>`,
  }).addFields([{ name: "Transaction", value: `[\`${tx_hash}\`](${tx_url})` }])
  return { messageOptions: { embeds: [embed] } }
}

const command: Command = {
  id: "tip-onchain",
  command: "tip",
  brief: "Onchain Tip Bot",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    return await claim(msg, args)
  },
  featured: {
    title: `${getEmoji("tip")} Claim your pending transfers`,
    description: "Claim transfers from others",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}claim 1234 0xabc`,
        description: "Send coins onchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot Onchain",
        examples: `\`\`\`${PREFIX}claim <Claim ID> <Your recpient address>\`\`\``,
      }).addFields({
        name: "**Instructions**",
        value: `[**Gitbook**](${TIP_GITBOOK})`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 3,
  allowDM: true,
}

export default command
