import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import {
  DirectMessageNotAllowedError,
  UserNotFoundError,
  UserNotVerifiedError,
} from "errors"
import Profile from "modules/profile"
import { composeEmbedMessage } from "utils/discord-embed"
import { thumbnails } from "utils/common"

async function deposit(msg: Message) {
  let user
  try {
    user = await Profile.getUser({
      discordId: msg.author.id,
      guildId: msg.guildId,
    })
    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guild?.id,
        discordId: msg.author.id,
      })
    }
    if (!user.is_verified) {
      throw new UserNotVerifiedError({ message: msg, discordId: msg.author.id })
    }

    let description = ":arrow_heading_down: **Deposit Bitcoin**"
    description +=
      "\n\nDeposits need at least 1 confirmation to be credited to your account."
    description += "\n\n**Your deposit address**"
    description += `\n\`${user.in_discord_wallet_address}\``
    await msg.author.send({
      embeds: [composeEmbedMessage(msg, { description })],
    })

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `:information_source: Info\n<@${msg.author.id}>, your deposit address has been sent to you via a DM`,
          }),
        ],
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
  name: "Deposit",
  category: "Defi",
  run: deposit,
  getHelpMessage: async (msg) => {
    const embedMsg = composeEmbedMessage(msg, {
      description: `\`\`\`Deposit tokens to your discord user\`\`\``,
    }).addField("_Examples_", `\`${PREFIX}deposit\``, true)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["dep"],
}

export default command
