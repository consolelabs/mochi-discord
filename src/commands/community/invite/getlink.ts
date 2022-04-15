import { Command } from "types/common"
import { PREFIX } from "env"
import { getEmbedFooter, getHeader, getHelpEmbed } from "utils/discord"
import Profile from "modules/profile"
import { UserNotFoundError, UserNotVerifiedError } from "errors"
import { MessageEmbed } from "discord.js"

const command: Command = {
  id: "invite_getlink",
  command: "getlink",
  name: "Get your invite link",
  category: "Community",
  run: async function (msg) {
    const userId = msg.author.id

    const user = await Profile.getUser({
      discordId: userId,
      guildId: msg.guildId,
    })
    if (!user) {
      throw new UserNotFoundError({
        guildId: msg.guildId,
        discordId: userId,
        message: msg,
      })
    }
    if (user.is_verified) {
      const embed = new MessageEmbed()
        .setDescription(`https://pod.town?code=${user.referral_code}`)
        .setFooter(
          getEmbedFooter([
            `${msg.author.username}#${msg.author.discriminator}`,
          ]),
          msg.author.avatarURL()
        )
      return {
        messageOptions: {
          content: getHeader("Getting invite link for", msg.author),
          embeds: [embed],
        },
      }
    } else {
      throw new UserNotVerifiedError({ message: msg, discordId: userId })
    }
  },
  getHelpMessage: async function () {
    const embedMsg = getHelpEmbed()
      .setTitle(`${PREFIX}invite getlink`)
      .addField("_Examples_", `\`${PREFIX}invite getlink\``, true)
      .setDescription(`\`\`\`Get your invite link.\`\`\``)
    return { embeds: [embedMsg] }
  },
}

export default command
