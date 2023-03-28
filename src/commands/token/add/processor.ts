import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageEmbed,
  MessageOptions,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from "discord.js"
import { MultipleResult, RunResult } from "types/common"
import {
  InternalError,
  GuildIdNotFoundError,
  APIError,
  OriginalMessage,
} from "errors"
import { Token } from "types/defi"
import {
  composeEmbedMessage,
  getEmbedFooter,
  getSuccessEmbed,
} from "ui/discord/embed"
import { InteractionHandler } from "handlers/discord/select-menu"
import Config from "../../../adapters/config"
import Defi from "../../../adapters/defi"
import * as SelectMenuUtil from "ui/discord/select-menu"
import * as ButtonUtil from "ui/discord/button"
import profile from "adapters/profile"
import {
  MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
  MOCHI_ACTION_TOKEN,
  MOCHI_APP_SERVICE,
} from "utils/constants"
import { KafkaQueueActivityDataCommand } from "types/common"
import { sendActivityMsg, defaultActivityMsg } from "utils/activity"

export async function process(
  msg: OriginalMessage,
  args: {
    guild_id: string
    user_discord_id: string
    channel_id: string
    message_id: string
    token_address: string
    token_chain: string
  }
) {
  const { ok, error, log, curl } = await Defi.requestSupportToken(args)
  if (!ok) {
    throw new APIError({ msgOrInteraction: msg, error, curl, description: log })
  }

  // send activity
  const isTextCommand = msg instanceof Message
  const userId = isTextCommand ? msg.author.id : msg.user.id
  const dataProfile = await profile.getByDiscord(userId)
  if (dataProfile.err) {
    throw new APIError({
      msgOrInteraction: msg,
      description: `[getByDiscord] API error with status ${dataProfile.status_code}`,
      curl: "",
    })
  }

  const kafkaMsg: KafkaQueueActivityDataCommand = defaultActivityMsg(
    dataProfile.id,
    MOCHI_PROFILE_ACTIVITY_STATUS_NEW,
    MOCHI_APP_SERVICE,
    MOCHI_ACTION_TOKEN
  )
  kafkaMsg.activity.content.address = args.token_address
  sendActivityMsg(kafkaMsg)

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          title: `Your Token submission is under review!`,
          description: `**Network** \`${args.token_chain.toUpperCase()}\`\n**Address** \`${
            args.token_address
          }\`\n\n**Your request is under review.** You will be notified the result through direct message!`,
        }),
      ],
    },
  }
}
const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const { message } = <{ message: Message }>interaction
  const symbol = interaction.values[0]

  if (!message.guildId) {
    throw new GuildIdNotFoundError({ message: msgOrInteraction })
  }

  await Config.updateTokenConfig({
    guild_id: message.guildId,
    symbol,
    active: true,
  })

  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg: message,
          description: `Successfully added **${symbol.toUpperCase()}** to server's tokens list.`,
        }),
      ],
      components: [],
    },
  }
}

export async function handleTokenApprove(i: ButtonInteraction) {
  await i.deferUpdate()
  const id = i.customId.split("-").pop()
  if (!id || Number.isNaN(+id) || !Number.isInteger(+id)) {
    throw new InternalError({
      msgOrInteraction: i,
      description: "invalid request id",
    })
  }
  const { ok, error, log, curl } = await Defi.approveTokenSupport(+id)
  if (!ok) {
    throw new APIError({ msgOrInteraction: i, error, curl, description: log })
  }
  const embed = i.message.embeds[0] as MessageEmbed
  embed
    .setFooter({
      text: getEmbedFooter([
        `Approved by ${i.member?.user.username}#${i.member?.user.discriminator}`,
      ]),
    })
    .setTimestamp(new Date())
  await i.editReply({ embeds: [embed], components: [] })
}

export async function handleTokenReject(i: ButtonInteraction) {
  await i.deferUpdate()
  const id = i.customId.split("-").pop()
  if (!id || Number.isNaN(+id) || !Number.isInteger(+id)) {
    throw new InternalError({
      msgOrInteraction: i,
      description: "invalid request id",
    })
  }
  const { ok, error, log, curl } = await Defi.rejectTokenSupport(+id)
  if (!ok) {
    throw new APIError({ msgOrInteraction: i, error, curl, description: log })
  }
  const embed = i.message.embeds[0] as MessageEmbed
  embed
    .setFooter({
      text: getEmbedFooter([
        `Rejected by ${i.member?.user.username}#${i.member?.user.discriminator}`,
      ]),
    })
    .setTimestamp(new Date())
  await i.editReply({ embeds: [embed], components: [] })
}

export async function handleTokenAdd(
  msg: Message | CommandInteraction,
  guildId: string,
  authorId: string
): Promise<
  RunResult<MessageOptions> | MultipleResult<Message | CommandInteraction>
> {
  const tokens = await Defi.getSupportedTokens()
  const { data: gTokens, ok, curl, log } = await Config.getGuildTokens(guildId)
  if (!ok) {
    throw new APIError({ curl, description: log })
  }
  let options: MessageSelectOptionData[] = tokens
    .filter((t) => !gTokens.map((gToken: Token) => gToken.id).includes(t.id))
    .map((token) => ({
      label: `${token.name} (${token.symbol})`,
      value: token.symbol,
    }))

  if (!options.length)
    throw new InternalError({
      msgOrInteraction: msg,
      description: "Your server already had all supported tokens.",
    })
  if (options.length > 25) {
    options = options.slice(0, 25)
  }

  const selectionRow = SelectMenuUtil.composeDiscordSelectionRow({
    customId: "guild_tokens_selection",
    placeholder: "Make a selection",
    options,
  })

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          title: "Need action",
          description:
            "Select to add one of the following tokens to your server.",
        }),
      ],
      components: [selectionRow, ButtonUtil.composeDiscordExitButton(authorId)],
    },
    interactionOptions: {
      handler,
    },
  }
}
