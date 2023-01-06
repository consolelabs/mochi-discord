import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import {
  getEmoji,
  roundFloatNumber,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"

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
  const pointingright = getEmoji("pointingright")
  if (!ok) {
    if (status === 404) {
      const { data, ok, log } = await defi.getUserOnchainTransfers(
        msg.author.id,
        "pending"
      )
      if (!ok) {
        throw new InternalError({
          message: msg,
          title: "Fail to claim tip!",
          description: log,
        })
      }
      const description = (
        data?.length
          ? [
              `${pointingright} You may enter an invalid \`claim ID\` or claimed one!`,
              `${pointingright} You can pick one of these \`claim ID\`: ${data
                .map((tx: any) => tx.id)
                .join(", ")}`,
              `${pointingright} You can only claim one transaction at once.`,
            ]
          : [
              "You don't have any unclaimed tips. You can try to tip other by using `$tip`.",
            ]
      ).join("\n")
      throw new InternalError({
        message: msg,
        title: "Fail to claim tip!",
        description,
      })
    }
    throw new APIError({ message: msg, curl, description: log, error })
  }
  const { amount, symbol, amount_in_usd, tx_hash, tx_url, recipient_address } =
    data

  const description = `${pointingright} **${amount} ${symbol}** (≈ $${roundFloatNumber(
    amount_in_usd,
    4
  )}) was sent to your address \`${shortenHashOrAddress(
    recipient_address
  )}\`! Check your wallet!\n${pointingright} You can claim another tip by using\n\`$claim <Claim ID> <your recipient address>\`.`
  const embed = getSuccessEmbed({
    msg,
    title: "Succesfully claimed!",
    description,
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
