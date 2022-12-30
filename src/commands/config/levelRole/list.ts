import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { ResponseGetLevelRoleConfigsResponse } from "types/api"
import { Command } from "types/common"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export function list({ data }: ResponseGetLevelRoleConfigsResponse) {
  if (data?.length === 0) {
    return {
      title: "No level roles found",
      description: `You haven't set any roles for this level yet. \n\nTo set a new one, run \`$lr @<role> <level>\`. \nThen re-check your configuration using \`$lr list\`.`,
    }
  }
  const description = data
    ?.map(
      (item) =>
        `**Level ${item.level}** - requires \`${
          item.level_config?.min_xp
        }\` XP\n${getEmoji("blank")}${getEmoji("reply")} <@&${item.role_id}>`
    )
    .join("\n")
  return {
    title: "Level role list",
    description: `Run \`$lr <role> <level>\` to add a level role.\n\n${description}`,
  }
}

const command: Command = {
  id: "lr_list",
  command: "list",
  brief: "List all active level roles",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg) {
    if (!msg.guildId || !msg.guild) {
      throw new GuildIdNotFoundError({ message: msg })
    }
    const res = await Config.getGuildLevelRoleConfigs(msg.guildId)
    if (!res.ok) {
      throw new APIError({
        message: msg,
        curl: res.curl,
        description: res.log,
      })
    }

    const { description, title } = list(res)
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [title, getEmojiURL(emojis.BADGE2)],
            description,
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}lr list`,
        examples: `${PREFIX}lr list`,
      }),
    ],
  }),
  canRunWithoutAction: true,
  colorType: "Server",
}

export default command
