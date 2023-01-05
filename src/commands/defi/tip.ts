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
  const onchain = args.at(-1) === "--onchain"
  args = args.slice(0, onchain ? -1 : undefined) // remove --onchain if any

  // check currency is moniker or supported
  const { newArgs: argsAfterParseMoniker, moniker } =
    await defi.parseMonikerinCmd(args, msg.guildId ?? "")

  // parse tip message
  const { newArgs: agrsAfterParseMessage, messageTip } =
    await defi.parseMessageTip(argsAfterParseMoniker)

  const newCmd = agrsAfterParseMessage.join(" ").trim()
  const { isValid, targets } = defi.classifyTipSyntaxTargets(
    newCmd
      .split(" ")
      .slice(1, newCmd.toLowerCase().endsWith("each") ? -3 : -2)
      .join(" ")
  )

  if (!isValid) {
    throw new InternalError({
      title: "Incorrect recipients",
      description:
        "Mochi cannot find the recipients. Type @ to choose valid roles or usernames!",
      message: msg,
    })
  }

  // check token supported
  const { cryptocurrency } = defi.parseTipParameters(agrsAfterParseMessage)
  if (!moniker && !(await defi.tipTokenIsSupported(cryptocurrency))) {
    throw new InternalError({
      message: msg,
      title: "Unsupported token",
      description: `**${cryptocurrency.toUpperCase()}** hasn't been supported.\n👉 Please choose one in our supported \`$token list\` or \`$moniker list\`!\n👉 To add your token, run \`$token add-custom\` or \`$token add\`.`,
    })
  }

  // preprocess command arguments
  const payload = await defi.getTipPayload(
    msg,
    agrsAfterParseMessage,
    authorId,
    targets
  )
  const amountBeforeMoniker = payload.amount
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

  // check balance
  const invalidBalEmbed = await defi.getInsuffientBalanceEmbed(
    msg,
    payload.sender,
    payload.token,
    payload.amount,
    payload.all ?? false
  )
  if (invalidBalEmbed) {
    return {
      embeds: [invalidBalEmbed],
    }
  }
  // transfer
  const transfer = (req: any) =>
    onchain
      ? defi.submitOnchainTransfer(req)
      : defi.offchainDiscordTransfer(req)
  const { data, ok, error, curl, log } = await transfer(payload)
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
  let description = `${mentionUser(
    payload.sender
  )} has sent ${recipientDescription} **${roundFloatNumber(
    data[0].amount,
    4
  )} ${payload.token}** (\u2248 $${roundFloatNumber(
    data[0].amount_in_usd,
    4
  )}) ${recipientIds.length > 1 ? "each" : ""}`
  if (moniker) {
    const monikerVal = moniker as ResponseMonikerConfigData
    const amountMoniker = roundFloatNumber(
      amountBeforeMoniker / payload.recipients.length,
      4
    )
    description = `${mentionUser(
      payload.sender
    )} has sent ${recipientDescription} **${amountMoniker} ${
      monikerVal?.moniker?.moniker
    }** (= **${roundFloatNumber(
      amountMoniker * (monikerVal?.moniker?.amount || 1)
    )} ${monikerVal?.moniker?.token?.token_symbol}** \u2248 $${roundFloatNumber(
      data[0].amount_in_usd,
      4
    )}) ${recipientIds.length > 1 ? "each" : ""}`
  }
  if (messageTip) {
    description += ` with message\n\n${getEmoji(
      "conversation"
    )} **${messageTip}**`
  }
  const embed = composeEmbedMessage(null, {
    thumbnail: thumbnails.TIP,
    author: ["Tips", getEmojiURL(emojis.COIN)],
    description: description,
  })
  if (imageUrl) {
    embed.setImage(imageUrl)
  }

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
        usage: `${PREFIX}tip <recipient(s)> <amount> <token> [each]\n${PREFIX}tip <recipient(s)> <amount> <token> [each] ["message"] [--onchain]`,
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
