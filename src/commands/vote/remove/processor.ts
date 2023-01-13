import config from "adapters/config"
import { Message } from "discord.js"
import { APIError } from "errors"
import { PREFIX } from "utils/constants"
import { getSuccessEmbed } from "ui/discord/embed"

export async function handle(guildId: string, msg: Message) {
  const res = await config.removeVoteChannel(guildId)
  if (!res.ok) {
    throw new APIError({ message: msg, curl: res.curl, description: res.log })
  }
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          title: "Successfully removed!",
          description: `No voting channel configured for this guild.\nSet one with \`${PREFIX}vote set <channel>.\``,
        }),
      ],
    },
  }
}
