import { Command } from "types/common"
import { Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import Community from "adapters/community"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, CommandError, GuildIdNotFoundError } from "errors"

const command: Command = {
  id: "invite_aggregation",
  command: "aggregation",
  brief: "Show user’s aggregated invites.",
  category: "Community",
  run: async function aggregation(msg: Message) {
    if (!msg.guild?.id) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const { isUser, value: inviterId } = parseDiscordToken(
      args.length === 3 ? args[2] : `<@${msg.author.id}>`
    )
    if (!isUser) {
      throw new CommandError({
        message: msg,
        description: "The argument was not a valid user",
      })
    }

    const res = await Community.getUserInvitesAggregation(
      msg.guild?.id,
      inviterId
    )

    if (!res.ok) {
      throw new APIError({ message: msg, description: res.log, curl: res.curl })
    }

    const embedMsg = composeEmbedMessage(msg, {
      title: `Invites Aggregation`,
      description: `<@${inviterId}> has totally ${
        res.data.regular
      } invites (normal: ${
        res.data.regular - res.data.fake - res.data.left
      }, fake: ${res.data.fake}, left: ${res.data.left})`,
    })

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
      document: `${INVITE_GITBOOK}&action=aggregation`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  aliases: ["aggr"],
  colorType: "Command",
}

export default command
