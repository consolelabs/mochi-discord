import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import { InvitesInput } from "types/community"
import { CommandInteraction, Message, User } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import { APIError, GuildIdNotFoundError } from "errors"

export async function handleInviteLink(msg: Message | CommandInteraction, guildId: string, user: User){
  const inviteInput = {
    guild_id: guildId,
    member_id: user.id,
  } as InvitesInput
  const { data, ok, curl, log } = await Community.getInvites(inviteInput)
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log })
  }

  if (!data || !data.webhook_url) {
    const embed = composeEmbedMessage(null, {
      title: "Info",
      description: "No invite links found",
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  const embedMsg = composeEmbedMessage(null, {
    title: `${user.username}'s invite link`,
    thumbnail: user.avatarURL() || undefined,
  }).addField(
    `https://discord.gg/${data[0]}`,
    `Invite link for this server ${msg.guild?.name}`
  )
  return {
    messageOptions: {
      embeds: [embedMsg],
    },
  }
}

const command: Command = {
  id: "invite_link",
  command: "link",
  brief: "Return the first invite link you created in the server",
  category: "Community",
  run: async function link(msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handleInviteLink(msg, msg.guildId, msg.author)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite link`,
      examples: `${PREFIX}invite link\n${PREFIX}inv link`,
      document: `${INVITE_GITBOOK}&action=link`,
      footer: [`Type \`${PREFIX}help invite <action>\` for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
