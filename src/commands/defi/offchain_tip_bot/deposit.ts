import { Command } from "types/common"
import { Message } from "discord.js"
import { DEPOSIT_GITBOOK, PREFIX, DEFI_DEFAULT_FOOTER } from "utils/constants"
import { DirectMessageNotAllowedError } from "errors"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"
import { APIError } from "errors"
import { getEmoji, defaultEmojis } from "utils/common"
import defi from "adapters/defi"
import { getCommandArguments } from "utils/commands"

async function deposit(msg: Message) {
  try {
    const tokenSymbol = getCommandArguments(msg)[1]
    const res = await defi.offchainTipBotAssignContract({
      user_id: msg.author.id,
      token_symbol: tokenSymbol,
    })

    if (!res.data) {
      throw new APIError({ curl: res.curl, description: res.log })
    }

    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ARROW_DOWN} **Deposit ${tokenSymbol}**`,
          description: `This is the wallet address linked with your discord account.
          Please deposit to the below address only.\n\nYour deposit address\n${getEmoji(
            tokenSymbol.toUpperCase()
          )}\`${res.data.contract.contract_address}\``,
        }),
      ],
    })

    if (msg.channel.type === "DM") return null

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `:information_source: Info\n<@${msg.author.id}>, your deposit address has been sent to you via a DM`,
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
  id: "depositoff",
  command: "depositoff",
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
  aliases: ["depoff"],
  allowDM: true,
  experimental: true,
  colorType: "Defi",
  minArguments: 2,
}

export default command
