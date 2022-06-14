import { Command } from "types/common"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import Config from "../../../adapters/config"

const command: Command = {
  id: "eventxp",
  command: "eventxp",
  brief:
    "Toggle event XP. If enabled, users will get XP when they join the event.",
  category: "Config",
  onlyAdministrator: true,
  run: async function(msg, action) {

    const args = getCommandArguments(msg)
    if (args.length != 2) {
      return {
        messageOptions: await this.getHelpMessage(msg)
      }
    }

    const [toggleAction] = args.slice(1)
		let active = false
    switch (toggleAction.toLowerCase()) {
			case "disable":
				break
			case "enable":
				active = true
				break
			default:
				return {
					messageOptions: await this.getHelpMessage(msg)
				}
		}

    await Config.toggleActivityConfig(msg.guildId, "event_host", active)
		await Config.toggleActivityConfig(msg.guildId, "event_participant", active)

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `Successfully ${active ? "enable" : "disable" } eventxp`
          })
        ]
      }
    }
  },
  getHelpMessage: async (msg, action) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}eventxp <enable|disable>`,
          examples: `${PREFIX}eventxp enable`
        })
      ]
    }
  },
  canRunWithoutAction: true,
  aliases: ["eventxp"]
}

export default command
