import { Command } from "types/common"
import { thumbnails } from "utils/common"
import { composeEmbedMessage, getSuccessEmbed } from "utils/discordEmbed"
import { PREFIX, TELEGRAM_GITBOOK } from "utils/constants"
import { getCommandArguments } from "utils/commands"
import config from "adapters/config"
import { APIError } from "errors"

const command: Command = {
  id: "telegram_config",
  command: "config",
  brief: "Link your Telegram account to Discord one",
  category: "Config",
  run: async (msg) => {
    const args = getCommandArguments(msg)
    const username = args[2]
    const { ok, log, curl } = await config.linkTelegramAccount({
      discord_id: msg.author.id,
      telegram_username: username,
    })
    if (!ok) {
      throw new APIError({ message: msg, curl, description: log })
    }
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            description: `Telegram \`${username}\` has been successfully linked with your discord account`,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        thumbnail: thumbnails.TOKENS,
        title: "Link your Telegram account to Discord one",
        usage: `${PREFIX}telegram config <telegram_username>`,
        examples: `${PREFIX}telegram config anhnh`,
        document: TELEGRAM_GITBOOK,
      }),
    ],
  }),
  minArguments: 3,
  aliases: ["cfg"],
  canRunWithoutAction: true,
  colorType: "Defi",
}

export default command
