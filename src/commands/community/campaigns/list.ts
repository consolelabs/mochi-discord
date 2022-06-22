import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import { Message } from "discord.js"
import community from "adapters/community"

const command: Command = {
  id: "whitelist_list",
  command: "list",
  brief: "List all active whitelist campaigns",
  category: "Community",
  run: async (msg: Message) => {
    let description = ""
    const res = await community.getAllRunningWhitelistCampaigns(msg.guild.id)

    if (res?.length) {
      description =
        "**List all running whitelist campaigns:**\n\n" +
        res.map((c: any) => `+ [id: ${c.role_id}] **${c.name}**`).join("\n") +
        "\n"
    } else {
      description =
        "**List all running whitelist campaigns:**\n\nHas no running whitelist campaigns."
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description,
            thumbnail: msg.guild.iconURL(),
          }),
        ],
      },
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          description: "List all active whitelist campaigns",
          usage: `${PREFIX}wl list`,
          examples: `${PREFIX}wl list`,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Command",
}

export default command
