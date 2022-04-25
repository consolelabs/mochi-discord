import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import Community from "adapters/community"
import { InvitesInput } from "types/community"
import { Message } from "discord.js"
import { getHeader } from "utils/common"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "invites_link",
  command: "link",
  name: "Return the first invite link you own found in the guild's invite links",
  category: "Community",
  run: async function link(msg: Message) {
    const inviteInput = {
      guild_id: msg.guild.id,
      member_id: msg.author.id,
    } as InvitesInput
    const { data }  = await Community.getInvites(inviteInput)
    if (data.length === 0) {
      return {
        messageOptions: {
          content: `${getHeader("No invite links found", msg.author)}`,
        },
      }
    }
    
    const embedMsg = composeEmbedMessage(msg, {
      title: `${msg.author.username}'s invite link`,
      thumbnail: msg.author.avatarURL(),
    })
    embedMsg.addField(
      `https://discord.gg/${data[0]}`,
      `Invite link for this server ${msg.guild.name}`,
    )
    return {
      messageOptions: {
        embeds: [embedMsg],
      }
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      description: `
      Return the first invite link you own found in the guild's invite links.\n
        **Usage**\`\`\`${PREFIX}invite link \`\`\`\n
        Type \`${PREFIX}help invite <action>\` to learn more about a specific action!`,
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
}

export default command
