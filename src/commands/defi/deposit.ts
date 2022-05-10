import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import { DirectMessageNotAllowedError, UserNotFoundError } from "errors"
import Profile from "adapters/profile"
import { composeEmbedMessage } from "utils/discordEmbed"
import { defaultEmojis } from "utils/common"

async function deposit(msg: Message) {
  let user
  try {
    user = await Profile.getUser({
      discordId: msg.author.id
    })
    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guild?.id,
        discordId: msg.author.id
      })
    }

    let description =
      "Deposits need at least 1 confirmation to be credited to your account."
    description += "\n\n**Your deposit address**"
    description += `\n\`${user.in_discord_wallet_address}\``
    await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ARROW_DOWN} **Deposit token**`,
          description
        })
      ]
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `:information_source: Info\n<@${msg.author.id}>, your deposit address has been sent to you via a DM`
          })
        ]
      }
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
  brief: "Deposit tokens to your in-discord wallet",
  category: "Defi",
  run: deposit,
  getHelpMessage: async msg => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}deposit`
      })
    ]
  }),
  canRunWithoutAction: true,
  aliases: ["dep"]
}

export default command
