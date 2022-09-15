import { Command } from "types/common"
import community from "adapters/community"
import { PREFIX, VERIFY_WALLET_GITBOOK } from "utils/constants"
import {
  composeEmbedMessage,
  getErrorEmbed,
  getSuccessEmbed,
} from "utils/discordEmbed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"

const command: Command = {
  id: "verify_set",
  command: "set",
  brief: "Create verify wallet channel",
  category: "Community",
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "This command must be run in a Guild",
            }),
          ],
        },
      }
    }
    const existChannel = await community.getVerifyWalletChannel(msg.guildId)
    if (existChannel.ok && existChannel.data?.verify_channel_id) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: `Your server already setup a channel for that -> <#${existChannel.data.verify_channel_id}>`,
            }),
          ],
        },
      }
    }
    const args = getCommandArguments(msg)
    const { isChannel, id: channelId } = parseDiscordToken(args[2])
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "Invalid channel",
            }),
          ],
        },
      }
    }

    const createVerifyWalletRequest = {
      verify_channel_id: channelId,
      guild_id: msg.guildId,
    }

    const res = await community.createVerifyWalletChannel(
      createVerifyWalletRequest
    )
    if (!res.ok) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: res.error,
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: "Channel set",
            description: `Mochi sent verify instructions to <#${channelId}> channel`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}verify set <channel>`,
        examples: `${PREFIX}verify set #general`,
        document: VERIFY_WALLET_GITBOOK,
        footer: [`Type ${PREFIX}help verify <action> for a specific action!`],
      }),
    ],
  }),
  canRunWithoutAction: true,
  onlyAdministrator: true,
  colorType: "Server",
  minArguments: 3,
}

export default command
