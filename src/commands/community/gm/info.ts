import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import config from "adapters/config"
import { GuildIdNotFoundError } from "errors"

export async function handle(guildId: string) {
  const data = await config.getCurrentGmConfig(guildId)
  if (!data) {
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(null, {
            description: `No configuration found`,
            title: "GM/GN Configuration",
          }),
        ],
      },
    }
  }
  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          description: `Current Gm/Gn channel is set to <#${data.channel_id}>`,
          title: "GM/GN Configuration",
        }),
      ],
    },
  }
}

const command: Command = {
  id: "gm_info",
  command: "info",
  brief: "Show current gm/gn configuration",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
      throw new GuildIdNotFoundError({ message: msg })
    }

    return await handle(msg.guildId)
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Show current gm/gn configuration",
          usage: `${PREFIX}gm info`,
          examples: `${PREFIX}gm info`,
          document: `${GM_GITBOOK}&action=info`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
  onlyAdministrator: true,
}

export default command
