import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { APIError, GuildIdNotFoundError } from "errors"
import { defaultEmojis, emojis, getEmojiURL } from "utils/common"
import { Message } from "discord.js"

export async function runVerify(msg: Message | null, guildId: string | null) {
  if (!guildId) {
    throw new GuildIdNotFoundError({ message: msg ?? undefined })
  }
  const res = await community.getVerifyWalletChannel(guildId)
  if (!res.ok) {
    throw new APIError({
      message: msg ?? undefined,
      curl: res.curl,
      description: res.log,
    })
  }
  if (!res.data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            title: "No verified channel found",
            author: ["Verify", getEmojiURL(emojis.APPROVE)],
            description: `You haven't set a channel for verification.\n${defaultEmojis.POINT_RIGHT} To set a new one, run \`verify set #<channel> @<verified role>\`.\n${defaultEmojis.POINT_RIGHT} Then re-check your configuration using \`verify info.\``,
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(msg, {
          author: ["Verify", getEmojiURL(emojis.APPROVE)],
          description: `Verify channel: <#${res.data.verify_channel_id}>${
            res.data.verify_role_id
              ? `\nVerify role: <@&${res.data.verify_role_id}>`
              : ""
          }`,
          footer: ["To change verify channel and role, use $verify remove"],
        }),
      ],
    },
  }
}

const command: Command = {
  id: "verify_info",
  command: "info",
  brief: "Show verify wallet channel",
  category: "Community",
  run: (msg) => runVerify(msg, msg.guildId),
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify info`,
        examples: `${PREFIX}verify info`,
        document: `${VERIFY_WALLET_GITBOOK}&action=info`,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
  minArguments: 2,
  onlyAdministrator: true,
}

export default command
