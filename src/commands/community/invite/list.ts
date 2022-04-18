import { Command } from "types/common"
import { MessageEmbed } from "discord.js"
import { PREFIX } from "utils/constants"
import { getHeader } from "utils/common"
import Invite from "modules/invite"
import Profile from "modules/profile"
import { UserNotFoundError, UserNotVerifiedError } from "errors"
import { composeEmbedMessage } from "utils/discord-embed"

const command: Command = {
  id: "invite_list",
  command: "list",
  name: "List your invitees",
  category: "Community",
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
      const msgEmbed = composeEmbedMessage(msg, {
        thumbnail:
          "https://cdn.discordapp.com/emojis/900748086522048512.png?size=240",
        description: `**Your invite link is**\n\`\`\`https://pod.town?code=${
          user.referral_code
        }\`\`\`\n\nUser that you invited (${invitees.length})\n${invitees.map(
          (addr) => `[${addr}](https://google.com)`
        )}`,
      })

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
  getHelpMessage: async function (msg) {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: `\`\`\`Get a list of user that you invited to this server.\`\`\``,
        }).addField("_Examples_", `\`${PREFIX}invite list\``, true),
      ],
    }
  },
}

export default command
