import { CommandInteraction, Message } from "discord.js"
import {
  DEFI_DEFAULT_FOOTER,
  PREFIX,
  SPACES_REGEX,
  TIP_GITBOOK,
} from "utils/constants"
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
import { ResponseMonikerConfigData } from "types/api"
import defi from "adapters/defi"
import { InternalError } from "errors"

export async function handleTip(
  args: string[],
  authorId: string,
  fullCmd: string,
  msg: Message | CommandInteraction
) {
  const [cmdWithoutMsg, messageTip] = args.join(" ").split('"')
  const { newArgs, moniker } = await defi.parseMonikerinCmd(
    cmdWithoutMsg.trim().split(SPACES_REGEX),
    msg.guildId ?? ""
  )
  const newCmd = newArgs.join(" ").trim()

  const { isValid, targets } = Defi.classifyTipSyntaxTargets(
    newCmd
      .split(" ")
      .slice(1, newCmd.toLowerCase().endsWith("each") ? -3 : -2)
      .join(" ")
  )

  if (!isValid) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Cannot find the recipients. Type @, then choose the valid role or username of the recipients!",
      message: msg,
    })
  }

  // preprocess command arguments
  const payload = await Defi.getTipPayload(msg, newArgs, authorId, targets)
  if (moniker) {
    payload.amount *=
      (moniker as ResponseMonikerConfigData).moniker?.amount ?? 1
  }
  let imageUrl
  if (msg instanceof Message) {
    imageUrl = msg.attachments.first()?.url
  }
  payload.fullCommand = fullCmd
  payload.image = imageUrl
  payload.message = messageTip
  const { data, ok, error, curl, log } = await Defi.offchainDiscordTransfer(
    payload
  )

  if (!ok) {
    throw new APIError({ message: msg, curl, description: log, error })
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
            .filter(
              (t) =>
                parseDiscordToken(t).isChannel || parseDiscordToken(t).isRole
            )
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
        usage: `${PREFIX}tip <recipient(s)> <amount> <token> [each]\n${PREFIX}tip <recipient(s)> <amount> <token> [each] ["message"]`,
        description: "Send coins offchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value:
            "👉 Username(s): `@minh`, `@tom`\n👉 Role(s): `@Staff`, `@Dev`\n👉 #Text_channel: `#mochi`, `#channel`\n👉 In voice channel: mention “`in voice channel`” to tip members currently in\n👉 Online status: add the active status “`online`” before mentioning recipients",
        },
        {
          name: "Tip with token:",
          value:
            "👉 Tip by the cryptocurrencies, choose one in the `$token list`.\n👉 To tip by moniker, choose one in the `$moniker list`.",
        },
        {
          name: "**Examples**",
          value: `\`\`\`${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John @Hank all ftm\n${PREFIX}tip @RandomRole 10 ftm\n${PREFIX}tip @role1 @role2 1 ftm each\n${PREFIX}tip in voice channel 1 ftm each\n${PREFIX}tip online #mochi 1 ftm\n${PREFIX}tip @John 1 ftm "Thank you"\`\`\``,
        },
        {
          name: "**Instructions**",
          value: `[**Gitbook**](${TIP_GITBOOK})`,
        }
      ),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

export default command
