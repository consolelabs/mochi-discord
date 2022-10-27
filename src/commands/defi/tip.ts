import { Message } from "discord.js"
// import { DEFI_DEFAULT_FOOTER, PREFIX, TIP_GITBOOK } from "utils/constants"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  roundFloatNumber,
  thumbnails,
} from "utils/common"
// import { getCommandArguments } from "utils/commands"
import { Command } from "types/common"
import {
  composeEmbedMessage,
  getErrorEmbed,
  workInProgress,
} from "utils/discordEmbed"
import { GuildIdNotFoundError } from "errors"
import { parseDiscordToken } from "utils/commands"
import Defi from "adapters/defi"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function tip(msg: Message, args: string[]) {
  // validate valid guild
  if (!msg.guildId) {
    throw new GuildIdNotFoundError({ message: msg })
  }

  // validate valid user
  const isUser = parseDiscordToken(args[1])
  if (!isUser) {
    return {
      embeds: [
        getErrorEmbed({
          msg,
          description:
            "Invalid username. Be careful to not be mistaken username with role.",
        }),
      ],
    }
  }

  // preprocess command arguments
  const payload = await Defi.getTipPayload(msg, args)
  payload.fullCommand = msg.content
  const res = await Defi.offchainDiscordTransfer(payload)

  if (!res.ok) {
    return {
      embeds: [getErrorEmbed({ msg, description: res.error })],
    }
  }

  const recipientIds: string[] = res.data.map((tx: any) => tx.recipient_id)
  const mentionUser = (discordId: string) => `<@!${discordId}>`
  const users = recipientIds.map((id) => mentionUser(id)).join(",")
  const embed = composeEmbedMessage(msg, {
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
  run: async () => ({ messageOptions: await workInProgress() }),
  // run: async function (msg: Message) {
  //   const args = getCommandArguments(msg)
  //   return {
  //     messageOptions: {
  //       ...(await tip(msg, args)),
  //     },
  //   }
  // },
  featured: {
    title: `${getEmoji("tip")} Tip`,
    description: "Send coins to a user or a group of users",
  },
  getHelpMessage: workInProgress,
  // getHelpMessage: async (msg) => ({
  //   embeds: [
  //     composeEmbedMessage(msg, {
  //       thumbnail: thumbnails.TIP,
  //       usage: `${PREFIX}tip <@user> <amount> <token>\n${PREFIX}tip <@role> <amount> <token>`,
  //       description: "Send coins offchain to a user or a group of users",
  //       examples: `${PREFIX}tip @John 10 ftm\n${PREFIX}tip @John all ftm\n${PREFIX}tip @John,@Hank 10 ftm\n${PREFIX}tip @RandomRole 10 ftm`,
  //       document: TIP_GITBOOK,
  //       footer: [DEFI_DEFAULT_FOOTER],
  //       title: "Tip Bot",
  //     }),
  //   ],
  // }),
  canRunWithoutAction: true,
  colorType: "Defi",
  minArguments: 4,
}

export default command
