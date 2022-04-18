import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { getHeader } from "utils/common"
import Profile from "modules/profile"
import { UserNotFoundError, UserNotVerifiedError } from "errors"
import { composeEmbedMessage } from "utils/discord-embed"

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
      const embed = composeEmbedMessage(msg, {
        description: `https://pod.town?code=${user.referral_code}`,
      })
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
  getHelpMessage: async function (msg) {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: `\`\`\`Get your invite link.\`\`\``,
        }).addField("_Examples_", `\`${PREFIX}invite getlink\``, true),
      ],
    }
  },
  experimental: true,
}

export default command
