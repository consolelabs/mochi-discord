import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import { InvitesInput } from "types/community"
import { Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import { APIError } from "errors"

const command: Command = {
  id: "invite_link",
  command: "link",
  brief: "Return the first invite link you created in the server",
  category: "Community",
  run: async function link(msg: Message) {
    const inviteInput = {
      guild_id: msg.guild?.id,
      member_id: msg.author.id,
    } as InvitesInput
    const { data, ok, log } = await Community.getInvites(inviteInput)
    if (!ok) {
      throw new APIError({ message: msg, description: log })
    }
    if (data.length) {
      const embed = composeEmbedMessage(msg, {
        title: "Info",
        description: "No invite links found",
      })
      return {
        messageOptions: {
          embeds: [embed],
        },
      }
    }

    const embedMsg = composeEmbedMessage(msg, {
      title: `${msg.author.username}'s invite link`,
      thumbnail: msg.author.avatarURL() || undefined,
    }).addField(
      `https://discord.gg/${data[0]}`,
      `Invite link for this server ${msg.guild?.name}`
    )
    return {
      messageOptions: {
        embeds: [embedMsg],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite link`,
      examples: `${PREFIX}invite link\n${PREFIX}inv link`,
      document: INVITE_GITBOOK,
      footer: [`Type \`${PREFIX}help invite <action>\` for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
