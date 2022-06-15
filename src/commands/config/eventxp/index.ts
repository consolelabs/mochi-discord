import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "eventxp",
  command: "eventxp",
  brief:
    "Toggle event XP. If enabled, users will get XP when they host/join the event.",
  category: "Config",
  onlyAdministrator: true,
  run: async function(msg, action) {

    const eventHostConfig = await Config.toggleActivityConfig(msg.guildId, "event_host")
		const eventParticipantConfig = await Config.toggleActivityConfig(msg.guildId, "event_participant")

    if (eventHostConfig.active != eventParticipantConfig.active) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              title: `${msg.guild.name}'s eventxp configuration`,
              description: "Event host and participant config are not the same!",
            }),
          ],
        },
      }
    }

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully ${eventHostConfig.active ? "enable" : "disable" } eventxp`
          })
        ]
      }
    }
  },
  getHelpMessage: async (msg, action) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}eventxp`,
          examples: `${PREFIX}eventxp`
        })
      ]
    }
  },
  canRunWithoutAction: true,
  aliases: ["eventxp"]
}

export default command
