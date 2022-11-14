import { Command } from "types/common"
import { Message } from "discord.js"
import { INVITE_GITBOOK, PREFIX } from "utils/constants"
import Community from "adapters/community"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { InternalError, GuildIdNotFoundError } from "errors"
import { emojis, getEmojiURL } from "utils/common"

const command: Command = {
  id: "invite_config",
  command: "config",
  brief: "Configure Invite Tracker log channel.",
  category: "Community",
  onlyAdministrator: true,
  run: async function config(msg: Message) {
    if (!msg.guild?.id) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    const args = getCommandArguments(msg)
    const { isChannel, value: log_channel } = parseDiscordToken(args[2])
    if (!isChannel) {
      throw new InternalError({
        message: msg,
        description: "Invalid channel. Please choose another one!",
      })
    }

    await Community.configureInvites({
      guild_id: msg.guild?.id,
      log_channel,
    })

    const embedMsg = composeEmbedMessage(msg, {
      author: ["Successfully configured!", getEmojiURL(emojis.APPROVE)],
      description: `Invite Tracker is now set to <#${log_channel}>.`,
    })

    return {
      messageOptions: {
        embeds: [embedMsg],
      },
    }
  },
  getHelpMessage: async (msg) => {
    const embed = composeEmbedMessage(msg, {
      usage: `${PREFIX}invite config <channel>`,
      examples: `${PREFIX}invite config #general\n${PREFIX}invite cfg #general`,
      document: `${INVITE_GITBOOK}&action=config`,
      footer: [`Type ${PREFIX}help invite <action> for a specific action!`],
    })

    return { embeds: [embed] }
  },
  canRunWithoutAction: true,
  aliases: ["cfg"],
  colorType: "Command",
  minArguments: 3,
}

export default command
