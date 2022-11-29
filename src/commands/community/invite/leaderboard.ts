import { Command } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Community from "adapters/community"
import { CommandInteraction, Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import { APIError } from "errors"

export async function handleInviteLeaderboard(msg: Message | CommandInteraction, guildId: string){
  const resp = await Community.getInvitesLeaderboard(guildId)
  if (!resp.ok) {
    throw new APIError({
      message: msg,
      curl: resp.curl,
      description: resp.log,
    })
  }

  const data = resp.data
  if (!data || !data.length) {
    const embed = composeEmbedMessage(null, {
      title: "Info",
      description: "Leaderboard is empty",
    })
    return {
      messageOptions: {
        embeds: [embed],
      },
    }
  }

  const embedMsg = composeEmbedMessage(null, {
    title: `Invites Leaderboard`,
  })

  const respMsg: string[] = []
  data.forEach((d: any) => {
    respMsg.push(
      `<@${d.inviter_id}>  (regular: ${d.regular}, fake: ${d.fake}, left: ${d.left})`
    )
  })
  embedMsg.addField(`Top 10`, respMsg.join("\n"))

  return {
    messageOptions: {
      embeds: [embedMsg],
    },
  }
}

const command: Command = {
  id: "invite_leaderboard",
  command: "leaderboard",
  brief: "Show top 10 inviters.",
  category: "Community",
  run: async function leaderboard(msg: Message) {
    if (!msg.guildId) {
      const errorEmbed = getErrorEmbed({
        msg,
        description: "Guild ID is invalid",
      })
      return {
        messageOptions: {
          embeds: [errorEmbed],
        },
      }
    }
    return await handleInviteLeaderboard(msg, msg.guildId)
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite leaderboard`,
      examples: `${PREFIX}invite leaderboard\n${PREFIX}invite lb`,
      document: `${INVITE_GITBOOK}&action=leaderboard`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  aliases: ["lb"],
  colorType: "Command",
}

export default command
