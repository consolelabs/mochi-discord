import { Command } from "types/common"
import { Message } from "discord.js"
import { PREFIX } from "utils/constants"
import Community from "adapters/community"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"

const command: Command = {
  id: "invite_aggregation",
  command: "aggregation",
  brief: "Show user’s aggregated invites.",
  category: "Community",
  run: async function aggregation(msg: Message) {
    let inviterID = msg.author.id
    const args = getCommandArguments(msg)
    if (args.length == 3) {
      inviterID = args[2].replace(/<@|>/g, "")
    }

    const data = await Community.getUserInvitesAggregation(
      msg.guild.id,
      inviterID
    )

    const embedMsg = composeEmbedMessage(msg, {
      title: `Invites Aggregation`,
    })

    embedMsg.addField(
      `Successfully`,
      `<@${inviterID}> has totally ${data.regular} invites (normal: ${
        data.regular - data.fake - data.left
      }, fake: ${data.fake}, left: ${data.left})`
    )

    return {
      messageOptions: {
        embeds: [embedMsg],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite aggregation <@userId>`,
      examples: `${PREFIX}invite aggregation @ohagi\n${PREFIX}invite aggr @ohagi`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  aliases: ["aggr"],
  colorType: "Command",
}

export default command
