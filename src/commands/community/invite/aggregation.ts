import { Command } from "types/common"
import { CommandInteraction, Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import Community from "adapters/community"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { APIError, InternalError, GuildIdNotFoundError } from "errors"
import { emojis, getEmojiURL } from "utils/common"

export async function handleInviteAggr(msg: Message | CommandInteraction, guildId: string, inviterId: string){
  const res = await Community.getUserInvitesAggregation(
    guildId,
    inviterId
  )

  if (!res.ok) {
    throw new APIError({ message: msg, description: res.log, curl: res.curl })
  }

  const embedMsg = composeEmbedMessage(null, {
    author: ["Invites Aggregation", getEmojiURL(emojis.HELLO)],
    description: `<@${inviterId}> has a total of ${
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
}

const command: Command = {
  id: "invite_aggregation",
  command: "aggregation",
  brief: "Show user's aggregated invites.",
  category: "Community",
  run: async function aggregation(msg: Message) {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const args = getCommandArguments(msg)
    const { isUser, value: inviterId } = parseDiscordToken(
      args.length === 3 ? args[2] : `<@${msg.author.id}>`
    )
    if (!isUser) {
      throw new InternalError({
        message: msg,
        description: "The argument was not a valid user",
      })
    }

    return await handleInviteAggr(msg, msg.guildId, inviterId)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite aggregation <@user>`,
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
