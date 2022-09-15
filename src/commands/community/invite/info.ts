import { Command } from "types/common"
import { Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "invite_info",
  command: "info",
  brief: "Show current Invite Tracker's log channel.",
  category: "Community",
  onlyAdministrator: true,
  run: async function config(msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await community.getCurrentInviteTrackerConfig(msg.guildId)
    if (!res.ok) {
      throw new APIError({ message: msg, description: res.log })
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Current Invite Tracker log channel is set to <#${res.data.user_id}>`,
            title: "Invite Tracker Configuration",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite info`,
      examples: `${PREFIX}invite info`,
      document: INVITE_GITBOOK,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
