import { Command } from "types/common"
import { Message, MessageEmbed } from "discord.js"
import { PREFIX, PROFILE_THUMBNAIL, SOCIAL_COLOR } from "env"
import {
  DirectMessageNotAllowedError,
  UserNotFoundError,
  UserNotVerifiedError,
} from "errors"
import Profile from "modules/profile"
import { getHelpEmbed } from "utils/discord"

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
        guildId: msg.guild.id,
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
    const dmEmbed = new MessageEmbed()
      .setThumbnail(PROFILE_THUMBNAIL)
      .setColor(SOCIAL_COLOR)
      .setDescription(description)

    await msg.author.send({ embeds: [dmEmbed] })

    const embed = new MessageEmbed()
      .setColor(SOCIAL_COLOR)
      .setDescription(
        `:information_source: Info\n<@${msg.author.id}>, your deposit address has been sent to you via a DM`
      )
    return {
      messageOptions: {
        embeds: [embed],
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
  getHelpMessage: async () => {
    let embedMsg = getHelpEmbed("Deposit")
      .setThumbnail(PROFILE_THUMBNAIL)
      .setTitle(`${PREFIX}deposit`)
      .addField("_Examples_", `\`${PREFIX}deposit\``, true)
      .setDescription(`\`\`\`Deposit tokens to your discord user\`\`\``)
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  alias: ["dep"],
}

export default command
