import { Command } from "types/common"
import { GM_GITBOOK, PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import config from "adapters/config"

const command: Command = {
  id: "gm_info",
  command: "info",
  brief: "GM/GN Configuration",
  category: "Community",
  run: async (msg) => {
    if (!msg.guildId) {
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
    const data = await config.getCurrentGmConfig(msg.guildId)
    if (!data) {
      return {
        messageOptions: {
          embeds: [
            composeEmbedMessage(msg, {
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
          composeEmbedMessage(msg, {
            description: `Current Gm/Gn channel is set to <#${data.channel_id}>`,
            title: "GM/GN Configuration",
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "Show current gm/gn configuration",
          usage: `${PREFIX}gm info`,
          examples: `${PREFIX}gm info`,
          document: GM_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
  onlyAdministrator: true,
}

export default command
