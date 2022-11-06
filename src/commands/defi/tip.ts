import { CommandInteraction, Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import { getCommandArguments } from "utils/commands"
import { Command } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { parseDiscordToken } from "utils/commands"
import Defi from "adapters/defi"
import { GuildIdNotFoundError } from "errors/GuildIdNotFoundError"

export async function handleTip(
  args: string[],
  authorId: string,
  fullCmd: string,
  msg: Message | CommandInteraction
) {
  // validate valid user
  const { isUser, isRole } = parseDiscordToken(args[1])
  if (!isUser && !isRole) {
    return {
      embeds: [
        getErrorEmbed({
          description: "Invalid recipients.",
        }),
      ],
    }
  }

  // preprocess command arguments
  const payload = await Defi.getTipPayload(msg, args, authorId, args[0])
  payload.fullCommand = fullCmd
  const res = await Defi.offchainDiscordTransfer(payload)

  if (!res.ok) {
    return {
      embeds: [getErrorEmbed({ description: res.error })],
    }
  }

  const recipientIds: string[] = res.data.map((tx: any) => tx.recipient_id)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = recipientIds.map((id) => mentionUser(id)).join(",")
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: `${mentionUser(
      payload.sender
    )} has sent ${users} **${roundFloatNumber(res.data[0].amount, 4)} ${
      payload.token
    }** ${payload.each ? "each" : ""}`,
  })

  return {
    embeds: [embed],
  }
}

const command: Command = {
  id: "tip",
  command: "tip",
  brief: "Tip Bot",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    // validate valid guild
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({})
    }
    return {
      messageOptions: {
        ...(await handleTip(args, msg.author.id, msg.content, msg)),
      },
    }
  },
  featured: {
    title: `${getEmoji("tip")} Tip`,
    description: "Send coins to a user or a group of users",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `- To tip a user or role:\n${PREFIX}tip <@user> <amount> <token>\n${PREFIX}tip <@role> <amount> <token>\n- To tip multiple users or roles\n${PREFIX}tip <@user(s)> <amount> <token> [each]\n${PREFIX}tip <@role(s)> <amount> <token> [each]`,
        description: "Send coins offchain to a user or a group of users",
        examples: `${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John all ftm\n${PREFIX}tip @John @Hank 10 ftm\n${PREFIX}tip @John @Hank 10 ftm each\n${PREFIX}tip @RandomRole 10 ftm\n${PREFIX}tip @role1 @role2 10 ftm\n${PREFIX}tip @role1 @role2 1 ftm each`,
        document: TIP_GITBOOK,
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

export default command
