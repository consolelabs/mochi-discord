import { Message, MessageEmbed } from "discord.js"
import { PREFIX, SOCIAL_COLOR } from "env"
import {
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
  thumbnails,
} from "utils/discord"
import Social from "modules/social"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"
import { Command } from "types/common"

async function tip(msg: Message, args: string[]) {
  const payload = await Social.getTransferRequestPayload(msg, args)
  const data = await Social.discordWalletTransfer(JSON.stringify(payload), msg)
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
  const embedMsg = new MessageEmbed()
    .setThumbnail(thumbnails.TIP)
    .setColor(SOCIAL_COLOR)
    .setAuthor("Generous")
    .setDescription(
      `${mentionUser(payload.fromDiscordId)} sent ${users} ${
        data[0].amount
      } ${tokenEmoji} ${payload.each ? "each" : ""}`
    )
    .setFooter(getEmbedFooter([msg.author.tag]), msg.author.avatarURL())
    .setTimestamp()
  return { embeds: [embedMsg] }
}

const command: Command = {
  id: "tip",
  command: "tip",
  name: "Tip",
  category: "Defi",
  run: async function (msg: Message) {
    const args = msg.content.replace(/  +/g, " ").trim().split(" ")
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
  getHelpMessage: async (_msg) => {
    const embedMsg = getHelpEmbed("Tip")
      .setThumbnail(thumbnails.TIP)
      .setTitle(`${PREFIX}tip`)
      .addField("_Usage_", `\`${PREFIX}tip @user <amount> <token>\``)
      .addField("_Examples_", `\`${PREFIX}tip @John 10 ftm\``)
      .setDescription(`\`\`\`Tip an amount of tokens to another user\`\`\``)
      .setFooter(`Use ${PREFIX}tokens for a list of supported tokens`)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
}

export default command
