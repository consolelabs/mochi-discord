import Config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"

const command: Command = {
  id: "lr_list",
  command: "list",
  brief: "Get server's levelroles configuration",
  category: "Config",
  onlyAdministrator: true,
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
    const data = await Config.getGuildLevelRoleConfigs(msg.guildId)
    if (!data || !data.data?.length) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${msg.guild.name}'s levelroles configuration`,
              description: "No configuration found!",
            }),
          ],
        },
      }
    }

    const description = data.data
      .map((c: any) => `**Level ${c.level}** - <@&${c.role_id}>`)
      .join("\n")
    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            author: [
              `${msg.guild.name}'s levelroles configuration`,
              msg.guild.iconURL(),
            ],
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
