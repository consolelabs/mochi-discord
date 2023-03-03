import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "ui/discord/embed"
import { APIError, GuildIdNotFoundError } from "errors"
import { Message } from "discord.js"
import { msgColors } from "utils/common"

const command: Command = {
  id: "poe_twitter_block_list",
  command: "list",
  brief: "Show your server's twitter blacklist",
  category: "Config",
  onlyAdministrator: true,
  run: async (msg: Message) => {
    if (!msg.guild) throw new GuildIdNotFoundError({ message: msg })
    const { data, ok, log, curl } = await config.getTwitterBlackList(
      msg.guild.id
    )
    if (!ok) {
      throw new APIError({
        msgOrInteraction: msg,
        curl: curl,
        description: log,
      })
    }
    if (!data?.length) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
              author: [
                `${msg.guild.name}'s twitter blacklist`,
                msg.guild.iconURL(),
              ],
              description:
                "The list is empty.\nYou can add one to your server using `$poe twitter block <twitter username or ID>`",
            }),
          ],
        },
      }
    }
    const description = data
      .map(
        (item: any) =>
          `[${item.twitter_username}](https://twitter.com/${item.twitter_username})`
      )
      .join("\n")
    const embed = composeEmbedMessage(msg, {
      author: [`${msg.guild.name}'s twitter blacklist`, msg.guild.iconURL()],
      description,
      color: msgColors.PINK,
    })

    return { messageOptions: { embeds: [embed] } }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}poe twitter block list`,
        examples: `${PREFIX}poe twitter block list`,
      }),
    ],
  }),
  colorType: "Server",
  canRunWithoutAction: true,
}

export default command
