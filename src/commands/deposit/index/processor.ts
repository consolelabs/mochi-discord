import { CommandInteraction, Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { composeButtonLink } from "ui/discord/button"
import {
  composeEmbedMessage,
  enableDMMessage,
  getErrorEmbed,
} from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"
import { emojis, getAuthor, getEmoji, getEmojiURL } from "utils/common"
import { MOCHI_SERVER_INVITE_URL } from "utils/constants"
import mochiPay from "../../../adapters/mochi-pay"
import { getProfileIdByDiscord } from "../../../utils/profile"
import * as processor from "./processor"

export async function deposit(interaction: CommandInteraction, token: string) {
  const author = getAuthor(interaction)
  const isDm = interaction.channel?.type === "DM"
  const symbol = token.toUpperCase()
  const res = await mochiPay.getTokens({
    symbol,
  })
  let tokens = []
  if (res.ok) {
    tokens = res.data.filter((t: any) => t.chain_id !== "0" && Boolean(t.chain))
  }
  if (tokens?.length < 1) {
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    throw new InternalError({
      msgOrInteraction: interaction,
      title: "Unsupported token",
      description: `**${symbol}** hasn't been supported.\n${pointingright} Please choose one in our supported \`$token list\` or \`$moniker list\`!\n${pointingright} To add your token, run \`$token add\`.`,
    })
  }

  const profileId = await getProfileIdByDiscord(author.id)
  const { ok, curl, log, data } = await mochiPay.deposit({
    profileId,
    token: symbol,
  })
  if (!ok) throw new APIError({ curl, description: log })

  // create QR code image
  // const qrFileName = `qr_${author.id}.png`
  // await qrcode.toFile(qrFileName, data.contract.address).catch(() => null)
  const dmEmbed = composeEmbedMessage(null, {
    author: [`Deposit ${symbol}`, getEmojiURL(emojis.WALLET)],
    // thumbnail: `attachment://${qrFileName}`,
    description: `Below is the deposit addresses on different chains. Please copy your deposit address and paste it into your third-party wallet or exchange.\n\n${getEmoji(
      "CLOCK"
    )} These deposit addresses is **valid for 3 hours**.\n\u200b`,
  }).addFields(
    data
      .filter((d: any) => d.contract?.chain?.symbol && d.contract?.address)
      .map((d: any) => ({
        name: String(d.contract.chain.symbol).toUpperCase(),
        value: `\`${d.contract.address}\``,
        inline: false,
      }))
  )

  const dm = await author
    .send({
      embeds: [dmEmbed],
      // files: [{ attachment: qrFileName }],
    })
    .catch(() => null)

  // delete QR code image
  // fs.unlink(qrFileName, () => null)

  // failed to send dm
  if (!dm) {
    return {
      messageOptions: {
        embeds: [enableDMMessage()],
      },
    }
  }

  // replace with a msg without contract after 3 hours
  // -> force users to reuse $deposit
  // -> prevent users from depositing to wrong / expired contract
  processor.handleDepositExpiration(dm, symbol)

  const dmRedirectEmbed = composeEmbedMessage(null, {
    author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
    description: `${author}, check your DM for deposit details.`,
    originalMsgAuthor: author,
  })

  if (isDm) return null

  return {
    messageOptions: {
      embeds: [dmRedirectEmbed],
      components: [composeButtonLink("See the DM", dm.url)],
    },
  }
}

/**
 * remove deposit address after get expired (3h)
 *
 *  -> force users to reuse $deposit
 *
 *  -> prevent users from depositing to wrong / expired contract
 *
 * @param toEdit
 * @param token
 */
export async function handleDepositExpiration(toEdit: Message, token: string) {
  const expiredEmbed = getErrorEmbed({
    title: `The ${token} deposit addresses has expired`,
    description: `Please re-run ${await getSlashCommand(
      "deposit"
    )} to get the new address. If you have deposited but the balance was not topped up, contact the team via [Mochi Server](${MOCHI_SERVER_INVITE_URL}).`,
  })
  setTimeout(() => {
    toEdit.edit({
      embeds: [expiredEmbed],
      files: [],
    })
  }, 10800000)
}
