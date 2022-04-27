import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import Community from "adapters/community"
import { composeEmbedMessage } from "utils/discord-embed"
import { getHeader, getCommandArguments } from "utils/common"

const command: Command = {
  id: "invites_aggregation",
  command: "aggregation",
  name: "Show user invites aggregation",
  category: "Community",
  run: async function aggregation(msg: Message) {
    let inviterID = msg.author.id
    const args = getCommandArguments(msg)
    if (args.length == 3) {
      inviterID = args[2].replace(/<@|>/g, "")
    }

    const resp = await Community.getUserInvitesAggregation(msg.guild.id, inviterID)
    if (resp.error) {
      return {
        messageOptions: {
          content: `${getHeader(resp.error, msg.author)}`,
        },
      }
    }

    const embedMsg = composeEmbedMessage(msg, {
      title: `Invites Aggregation`,
    })
    
    const data = resp.data
    embedMsg.addField(
      `Successfully`, 
      `<@${inviterID}> has totally ${data.regular} invites (normal: ${data.regular-data.fake-data.left}, fake: ${data.fake}, left: ${data.left})`
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
      Show user invites aggregation.\n
        **Usage**\`\`\`${PREFIX}invite aggregation <@userId> \`\`\`\n
        **Example**\`\`\`${PREFIX}invite config @ohagi \`\`\`\n
        Type \`${PREFIX}help invite <action>\` to learn more about a specific action!
      `,
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
}

export default command
