import { Command } from "types/common"
import { CommandInteraction, Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import community from "adapters/community"
import { APIError, GuildIdNotFoundError } from "errors"

export async function handleInviteInfo(msg: Message | CommandInteraction, guildId: string){
  const res = await community.getCurrentInviteTrackerConfig(guildId)
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }

  if (!res.data){
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            description: "Invite Tracker log channel has not been set, use `invite config` to set one",
            title: "Invite Tracker log channel not set",
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          description: `Current Invite Tracker log channel is set to <#${res.data.channel_id}>`,
          title: "Invite Tracker Configuration",
        }),
      ],
    },
  }
}

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
    return await handleInviteInfo(msg, msg.guildId)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite info`,
      examples: `${PREFIX}invite info`,
      document: `${INVITE_GITBOOK}&action=info`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
