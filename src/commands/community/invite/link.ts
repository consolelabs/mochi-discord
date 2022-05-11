import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import Community from "adapters/community"
import { InvitesInput } from "types/community"
import { Message } from "discord.js"
import { getHeader } from "utils/common"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "invite_link",
  command: "link",
  brief: "Return the first invite link you created in the server",
  category: "Community",
  run: async function link(msg: Message) {
    const inviteInput = {
      guild_id: msg.guild.id,
      member_id: msg.author.id
    } as InvitesInput
    const { data } = await Community.getInvites(inviteInput)
    if (data.length === 0) {
      return {
        messageOptions: {
          content: `${getHeader("No invite links found", msg.author)}`
        }
      }
    }

    const embedMsg = composeEmbedMessage(msg, {
      title: `${msg.author.username}'s invite link`,
      thumbnail: msg.author.avatarURL()
    })
    embedMsg.addField(
      `https://discord.gg/${data[0]}`,
      `Invite link for this server ${msg.guild.name}`
    )
    return {
      messageOptions: {
        embeds: [embedMsg]
      }
    }
  },
  getHelpMessage: async msg => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite link`,
      footer: [`Type \`${PREFIX}help invite <action>\` for a specific action!`]
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true
}

export default command
