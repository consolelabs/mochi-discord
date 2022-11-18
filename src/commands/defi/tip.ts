import { CommandInteraction, Message } from "discord.js"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { Command } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import Defi from "adapters/defi"
import { GuildIdNotFoundError } from "errors/GuildIdNotFoundError"
import { APIError } from "errors/APIError"
import { DiscordWalletTransferError } from "errors/DiscordWalletTransferError"

export async function handleTip(
  args: string[],
  authorId: string,
  fullCmd: string,
  msg: Message | CommandInteraction
) {
  const { isValid, targets } = Defi.classifyTipSyntaxTargets(
    fullCmd
      .split(" ")
      .slice(1, fullCmd.toLowerCase().endsWith("each") ? -3 : -2)
      .join(" ")
  )

  if (!isValid) {
    throw new DiscordWalletTransferError({
      guildId: msg.guildId ?? "DM",
      errorMsg: "Incorrect recipients",
      discordId: authorId,
      messageOrInteraction: msg,
    })
  }

  // preprocess command arguments
  const payload = await Defi.getTipPayload(msg, args, authorId, targets)
  payload.fullCommand = fullCmd
  const { data, ok, error, curl, log } = await Defi.offchainDiscordTransfer(
    payload
  )

  if (!ok) {
    throw new APIError({ curl, description: log, error })
  }

  const recipientIds: string[] = data.map((tx: any) => tx.recipient_id)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = recipientIds.map((id) => mentionUser(id)).join(", ")
  const isOnline = targets.includes("online")
  const hasRole = targets.some((t) => parseDiscordToken(t).isRole)
  const hasChannel = targets.some((t) => parseDiscordToken(t).isChannel)
  let recipientDescription = users
  if (hasRole || hasChannel || isOnline) {
    recipientDescription = `**${data.length}${
      isOnline ? ` online` : ""
    } user(s)${data.length >= 20 ? "" : ` (${users})`}**${
      isOnline && !hasRole && !hasChannel
        ? ""
        : ` in ${targets
            .filter((t) => t.toLowerCase() !== "online")
            .join(", ")}`
    }`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: `${mentionUser(
      payload.sender
    )} has sent ${recipientDescription} **${roundFloatNumber(
      data[0].amount,
      4
    )} ${payload.token}** (\u2248 $${roundFloatNumber(
      data[0].amount_in_usd,
      4
    )}) ${recipientIds.length > 1 ? "each" : ""}`,
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
        ...(await handleTip(
          args,
          msg.author.id,
          msg.content.replaceAll(/\s{2,}/gim, " "),
          msg
        )),
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
