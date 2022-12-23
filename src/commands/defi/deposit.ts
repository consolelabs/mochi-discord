import { Command } from "types/common"
import { Message } from "discord.js"
import { DEPOSIT_GITBOOK, PREFIX, DEFI_DEFAULT_FOOTER } from "utils/constants"
import { DirectMessageNotAllowedError, InternalError } from "errors"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"
import { APIError } from "errors"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"

async function deposit(msg: Message) {
  try {
    const tokenSymbol = getCommandArguments(msg)[1]
    const { ok, status, curl, log, data } =
      await defi.offchainTipBotAssignContract({
        user_id: msg.author.id,
        token_symbol: tokenSymbol,
      })
    if (!ok && status === 404) {
      throw new InternalError({
        title: "Command error",
        message: msg,
        description: `**${tokenSymbol.toUpperCase()}** hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`,
      })
    }
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }

    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          author: [
            `Deposit ${tokenSymbol.toUpperCase()}`,
            getEmojiURL(emojis.WALLET),
          ],
          description: `Below is the wallet address linked to your Discord account.
          Please deposit to the following address only ${getEmoji(
            "ok1"
          )}.\n\n**Your deposit address**\n\`\`\`${
            data.contract.contract_address
          }\`\`\``,
        }),
      ],
    })

    if (msg.channel.type === "DM") return null

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Deposit tokens", getEmojiURL(emojis.WALLET)],
            description: `${msg.author}, your deposit address has been sent to you. Check your DM!`,
          }),
        ],
        components: [composeButtonLink("See the DM", dm.url)],
      },
    }
  } catch (e: any) {
    if (msg.channel.type !== "DM" && e.httpStatus === 403) {
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
  run: deposit,
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
