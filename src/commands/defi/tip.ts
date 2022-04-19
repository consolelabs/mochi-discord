import { Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX } from "utils/constants"
import {
  getCommandArguments,
  getEmoji,
  getHeader,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import Defi from "modules/defi"

async function tip(msg: Message, args: string[]) {
  const payload = await Defi.getTransferRequestPayload(msg, args)
  const data = await Defi.discordWalletTransfer(JSON.stringify(payload), msg)
  if (!data || data.length === 0) {
    throw new DiscordWalletTransferError({
      discordId: msg.author.id,
      guildId: msg.guildId,
      message: msg,
    })
  }

  const discordIds: string[] = data.map((tx: any) => tx.toDiscordID)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = discordIds.map((id) => mentionUser(id)).join(",")
  const tokenEmoji = getEmoji(payload.cryptocurrency)
  return {
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        author: ["Generous"],
        description: `${mentionUser(
          payload.fromDiscordId
        )} sent ${users} ${roundFloatNumber(data[0].amount, 4)} ${tokenEmoji} ${
          payload.each ? "each" : ""
        }`,
      }),
    ],
  }
}

const command: Command = {
  id: "tip",
  command: "tip",
  name: "Tip",
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
        content: getHeader("Tip from", msg.author),
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      description: `\`\`\`Tip an amount of tokens to another user\`\`\``,
      thumbnail: thumbnails.TIP,
      footer: [DEFI_DEFAULT_FOOTER],
    })
      .addField("_Usage_", `\`${PREFIX}tip @user <amount> <token>\``)
      .addField("_Examples_", `\`${PREFIX}tip @John 10 ftm\``)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
}

export default command
