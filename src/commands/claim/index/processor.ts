import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { getEmoji, roundFloatNumber, shortenHashOrAddress } from "utils/common"
import { getSuccessEmbed } from "ui/discord/embed"
import { DISCORD_URL } from "utils/constants"

export async function claim(msg: Message, args: string[]) {
  const [claimId, address] = args.slice(1)
  if (!+claimId) {
    throw new InternalError({
      msgOrInteraction: msg,
      title: "Claiming failed!",
      description: "`claim ID` must be a number",
    })
  }
  const { data, ok, error, curl, log, status, originalError } =
    await defi.claimOnchainTransfer({
      claim_id: +claimId,
      address,
      user_id: msg.author.id,
    })
  const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
  if (!ok) {
    switch (true) {
      case status === 404: {
        const { data, ok, log } = await defi.getUserOnchainTransfers(
          msg.author.id,
          "pending"
        )
        if (!ok) {
          throw new InternalError({
            msgOrInteraction: msg,
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
          msgOrInteraction: msg,
          title: "Fail to claim tip!",
          description,
        })
      }
      case originalError?.toLowerCase().includes("balance is not enough"):
      case originalError?.toLowerCase().includes("insufficient fund"):
        throw new InternalError({
          msgOrInteraction: msg,
          title: "Failed to claim tip!",
          description: `Mochi wallet's balance is insufficient to proceed this transaction.\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} You can contact our developer at suggestion forum in [Mochi Discord](${DISCORD_URL})!\n${getEmoji(
            "ANIMATED_POINTING_RIGHT",
            true
          )} You can try to claim other tips and get back to this one later! ${getEmoji(
            "SOON"
          )}\nSorry for this inconvenience ${getEmoji("NEKOSAD")}`,
        })
      default:
        throw new APIError({
          msgOrInteraction: msg,
          curl,
          description: log,
          error,
        })
    }
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
