import { Command } from "commands"
import { MessageEmbed } from "discord.js"
import { PREFIX } from "env"
import { getHeader, getHelpEmbed } from "utils/discord"
import Invite from "modules/invite"
import Profile from "modules/profile"
import { UserNotFoundError, UserNotVerifiedError } from "errors"

const command: Command = {
  id: "invite_list",
  command: "list",
  name: "List your invitees",
  category: "Profile",
  run: async function (msg) {
    const userId = msg.author.id

    const user = await Profile.getUser({
      discordId: userId,
      guildId: msg.guildId,
    })
    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guildId,
        discordId: userId,
      })
    }
    if (user.is_verified) {
      const invitees = await Invite.getInvitees(user.referral_code)

      let msgEmbed = new MessageEmbed()
        .setColor("#f06d85")
        .setThumbnail(
          "https://cdn.discordapp.com/emojis/900748086522048512.png?size=240"
        )
        .setDescription(
          `**Your invite link is**\n\`\`\`https://pod.town?code=${
            user.referral_code
          }\`\`\`\n\nUser that you invited (${invitees.length})\n${invitees.map(
            (addr) => `[${addr}](https://pod.town)`
          )}`
        )

      return {
        messageOptions: {
          content: getHeader("Get users list invited by", msg.author),
          embeds: [msgEmbed],
        },
      }
    } else {
      throw new UserNotVerifiedError({ message: msg, discordId: userId })
    }
  },
  getHelpMessage: async function () {
    let embedMsg = getHelpEmbed()
      .setTitle(`${PREFIX}invite list`)
      .addField("_Examples_", `\`${PREFIX}invite list\``, true)
      .setDescription(
        `\`\`\`Get a list of user that you invited to Pod Town.\`\`\``
      )
    return { embeds: [embedMsg] }
  },
}

export default command
