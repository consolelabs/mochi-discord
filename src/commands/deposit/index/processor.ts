import { CommandInteraction, Message } from "discord.js"
import { DirectMessageNotAllowedError, InternalError } from "errors"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError } from "errors"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import defi from "adapters/defi"
import { composeButtonLink } from "ui/discord/button"

export async function deposit(
  msgOrInteraction: Message | CommandInteraction,
  tokenSymbol: string
) {
  const msg =
    msgOrInteraction instanceof Message
      ? <Message>msgOrInteraction
      : <CommandInteraction>msgOrInteraction
  const author =
    msgOrInteraction instanceof Message
      ? msgOrInteraction.author
      : msgOrInteraction.user
  try {
    const { ok, status, curl, log, data, error } =
      await defi.offchainTipBotAssignContract({
        user_id: author.id,
        token_symbol: tokenSymbol,
      })
    if (!ok && status === 404) {
      let description
      switch (error?.toLowerCase()) {
        case "contract not found or already assigned":
          description = `${getEmoji(
            "nekosad"
          )} Unfortunately, no **${tokenSymbol.toUpperCase()}** contract is available at this time. Please try again later`
          break
        default:
          description = `**${tokenSymbol.toUpperCase()}** hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`
          break
      }
      throw new InternalError({
        title: "Command error",
        message: msg,
        description,
      })
    }
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }

    const dm = await author.send({
      embeds: [
        composeEmbedMessage(null, {
          author: [
            `Deposit ${tokenSymbol.toUpperCase()}`,
            getEmojiURL(emojis.WALLET),
          ],
          description: `Below is the wallet address linked to your Discord account.
          Please deposit to the following address only ${getEmoji(
            "ok1"
          )}.\n**Your deposit address is only valid for 7 days. Please re-check your deposit address using \`$deposit <cryptocurrency>\` before making a deposit.**\n\n**Your deposit address**\n\`\`\`${
            data.contract.contract_address
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
            description: `${author}, your deposit address has been sent to you. Check your DM!`,
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
