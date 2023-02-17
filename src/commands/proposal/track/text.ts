import { GuildIdNotFoundError } from "errors"
import { Command } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "ui/discord/embed"
import { getCommandArguments, parseDiscordToken } from "utils/commands"
import { getEmoji } from "utils/common"
import { PREFIX } from "utils/constants"
import { handle } from "./processor"

const command: Command = {
  id: "daovote_track",
  command: "track",
  brief: "Set up a tracker of proposal voting rounds on Snapshot.",
  category: "Config",
  run: async (msg) => {
    if (!msg.guild) {
      throw new GuildIdNotFoundError({})
    }
    const args = getCommandArguments(msg)
    const [channelArg, url] = args.slice(2)
    const { isChannel, value: channelId } = parseDiscordToken(channelArg)
    if (!isChannel) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              title: "Invalid channel",
              description: `Please choose a text channel`,
            }),
          ],
        },
      }
    }
    return handle(msg, channelId, url, msg.guildId ?? "")
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: "Set up a tracker of proposal voting rounds on Snapshot.",
        usage: `${PREFIX}proposal track #channel <snapshot_DAO_link>\n${PREFIX}proposal track #channel <dao_space>`,
        description: `${getEmoji(
          "pointingright"
        )} Manage to post proposals and the voting space.\n${getEmoji(
          "pointingright"
        )} Receive the notification when proposals are opened for voting on [Snapshot](https://snapshot.org/#/).`,
        examples: `${PREFIX}proposal track #general https://snapshot.org/#/bitdao.eth\n${PREFIX}proposal track #general bitdao.eth`,
      }),
    ],
  }),
  colorType: "Server",
  minArguments: 4,
}

export default command
