import Config from "adapters/config"
import { APIError, GuildIdNotFoundError } from "errors"
import { ResponseGetLevelRoleConfigsResponse } from "types/api"
import { Command } from "types/common"
import { emojis, getEmoji, getEmojiURL } from "utils/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"

export function list({ data }: ResponseGetLevelRoleConfigsResponse) {
  if (data?.length === 0) {
    return `No level roles found! To set a new one, run \`\`\`$lr <role> <level>\`\`\``
  }
  const description = data
    ?.map(
      (item) =>
        `**Level ${item.level}** - requires \`${
          item.level_config?.min_xp
        }\` XP\n${getEmoji("blank")}${getEmoji("reply")} <@&${item.role_id}>`
    )
    .join("\n")
  return `Run \`$rr set <message_id> <emoji> <role>\` to add a reaction role.\n\n${description}`
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

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: ["Level role list", getEmojiURL(emojis.BADGE2)],
            description: list(res),
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
