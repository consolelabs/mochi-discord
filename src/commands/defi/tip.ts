import { Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
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
import { composeEmbedMessage } from "utils/discordEmbed"
import Defi from "adapters/defi"

async function tip(msg: Message, args: string[]) {
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
  brief: "Sends coins to a user or a group of users",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 4) {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
    const embeds = await tip(msg, args)
    return {
      messageOptions: {
        ...embeds,
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}tip <@user> <amount> <token>\n${PREFIX}tip <@role> <amount> <token>`,
        examples: `${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John all ftm\n${PREFIX}tip @John,@Hank 10 ftm\n${PREFIX}tip @RandomRole 10 ftm`,
        footer: [DEFI_DEFAULT_FOOTER],
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
