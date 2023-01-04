import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError, InternalError } from "errors"
import { Command } from "types/common"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  shortenHashOrAddress,
  thumbnails,
} from "utils/common"
import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"

async function handleTipOnchain(
  args: string[],
  authorId: string,
  fullCmd: string,
  msg: Message,
  userReply?: Message
) {
  const recipientAddress = userReply?.content.trim() ?? ""
  // remove --onchain
  args = args.slice(0, -1)
  // parse tip message
  const { newArgs: agrsAfterParseMessage, messageTip } =
    await defi.parseMessageTip(args)

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
  if (!(await defi.tipTokenIsSupported(cryptocurrency))) {
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
  const { data, ok, error, curl, log } = await defi.onchainDiscordTransfer({
    ...payload,
    recipients_addresses: [recipientAddress],
  })
  if (!ok) {
    throw new APIError({ message: msg, curl, description: log, error })
  }

  const recipientIds: string[] = data.map((tx: any) => tx.recipient_id)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = recipientIds
    .map(
      (id) =>
        `${mentionUser(id)}  (${shortenHashOrAddress(
          data[0].recipient_address
        )})`
    )
    .join(", ")
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

  userReply?.reply({ embeds: [embed] })
  return null
}

const command: Command = {
  id: "tip-onchain",
  command: "tip",
  brief: "Onchain Tip Bot",
  category: "Defi",
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    if (args.length < 5) {
      return {
        messageOptions: await this.getHelpMessage(msg),
      }
    }
    // input recipient address
    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Tipping on-chain", getEmojiURL(emojis.WALLET)],
          description: `Please enter the recipient's **${args[3].toUpperCase()}** address that you want to send your tokens to.`,
        }),
      ],
    })
    msg.reply({
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Tiping on-chain", getEmojiURL(emojis.WALLET)],
          description: `${msg.author}, open your DM to continue tipping!`,
        }),
      ],
      components: [composeButtonLink("See the DM", dm.url)],
    })
    const collected = await dm.channel.awaitMessages({
      max: 1,
      filter: (collected: Message) => collected.author.id === msg.author.id,
    })
    const userReply = collected.first()
    return {
      messageOptions: {
        ...(await handleTipOnchain(
          args,
          msg.author.id,
          msg.content.replaceAll(/\s{2,}/gim, " "),
          msg,
          userReply
        )),
      },
    }
  },
  featured: {
    title: `${getEmoji("tip")} Tip onchain`,
    description: "Send coins to a given address",
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TIP,
        usage: `${PREFIX}tip <recipient> <amount> <token> ["message"] --onchain`,
        description: "Send coins onchain to a user or a group of users",
        footer: [DEFI_DEFAULT_FOOTER],
        title: "Tip Bot Onchaiin",
      }).addFields(
        {
          name: "You can send to the recipient by:",
          value:
            "👉 Username(s): `@minh`, `@tom`\n👉 Role(s): `@Staff`, `@Dev`\n👉 #Text_channel: `#mochi`, `#channel`\n👉 In voice channel: mention “`in voice channel`” to tip members currently in\n👉 Online status: add the active status “`online`” before mentioning recipients",
        },
        {
          name: "**Examples**",
          value: `\`\`\`${PREFIX}tip @John 10 ftm --onchain\n${PREFIX}tip @John @Hank all ftm --onchain\n${PREFIX}tip @RandomRole 10 ftm --onchain\n${PREFIX}tip @role1 @role2 1 ftm --onchain\n${PREFIX}tip in voice channel 1 ftm --onchain\n${PREFIX}tip online #mochi 1 ftm --onchain\n${PREFIX}tip @John 1 ftm "Thank you" --onchain\`\`\``,
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
  minArguments: 5,
}

export default command
