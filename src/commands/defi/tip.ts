import { Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import {
  emojis,
  getEmojiURL,
  roundFloatNumber,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import { getCommandArguments } from "utils/commands"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { Command } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Defi from "adapters/defi"

async function tip(msg: Message, args: string[]) {
  if (!msg.guildId) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description: "This command must be run in a Guild",
        }),
      ],
    }
  }

  const userArg = args[1]
  if (!userArg.startsWith("<@") || !userArg.endsWith(">")) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description:
            "Invalid username. Be careful to not be mistaken username with role.",
        }),
      ],
    }
  }

  const payload = await Defi.getTransferPayload(msg, args)
  const data = await Defi.discordWalletTransfer(JSON.stringify(payload), msg)
  if (!data || data.length === 0) {
    throw new DiscordWalletTransferError({
      discordId: msg.author.id,
      guildId: msg.guildId,
      message: msg,
    })
  }

  const { txHash = "", txUrl = "" } = data.length === 1 ? data[0] : {}

  const discordIds: string[] = data.map((tx: any) => tx.toDiscordID)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = discordIds.map((id) => mentionUser(id)).join(",")
  const embed = composeEmbedMessage(msg, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: `${mentionUser(
      payload.sender
    )} has sent ${users} **${roundFloatNumber(data[0].amount, 4)} ${
      payload.cryptocurrency
    }** ${payload.each ? "each" : ""}`,
  })
  if (txHash && txUrl)
    embed.addField(
      "Transaction ID",
      `[\`${shortenHashOrAddress(txHash)}\`](${txUrl})`
    )
  return {
    embeds: [embed],
  }
}

const command: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    return {
      messageOptions: {
        ...(await tip(msg, args)),
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}tip <@user> <amount> <token>\n${PREFIX}tip <@role> <amount> <token>`,
        description: "Send coins to a user or a group of users",
        examples: `${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John all ftm\n${PREFIX}tip @John,@Hank 10 ftm\n${PREFIX}tip @RandomRole 10 ftm`,
        document: TIP_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

export default command
