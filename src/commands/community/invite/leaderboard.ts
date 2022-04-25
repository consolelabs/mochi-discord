import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import Community from "adapters/community"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"

const command: Command = {
  id: "invites_leaderboard",
  command: "leaderboard",
  name: "Show top 10 inviters",
  category: "Community",
  run: async function leaderboard(msg: Message) {
    const { data }  = await Community.getInvitesLeaderboard(msg.guild.id)
    if (data.length === 0) {
      return {
        messageOptions: {
          content: `${"Leaderboard is empty"}`,
        },
      }
    }
    
    const embedMsg = composeEmbedMessage(msg, {
      title: `Invites Leaderboard`,
    })
    
    const respMsg: string[] = []
    data.forEach((d: any) => {
      respMsg.push(`<@${d.inviter_id}>  (regular: ${d.regular}, fake: ${d.fake}, left: ${d.left})`)
    })
    embedMsg.addField(`Top 10`, respMsg.join("\n"))
    
    return {
      messageOptions: {
        embeds: [embedMsg],
      }
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      description: `
      Show top 10 inviters.\n
        **Usage**\`\`\`${PREFIX}invite leaderboard \`\`\`\n
        Type \`${PREFIX}help invite <action>\` to learn more about a specific action!`,
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
}

export default command
