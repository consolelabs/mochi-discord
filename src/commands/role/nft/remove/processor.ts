import Config from "adapters/config"
import { Message, SelectMenuInteraction } from "discord.js"
import { list } from "../processor"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getErrorEmbed, getSuccessEmbed } from "ui/discord/embed"
import { getSlashCommand } from "utils/commands"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [groupId, name] = interaction.values[0].split("|")
  await Config.removeGuildNFTRoleGroupConfig(
    groupId,
    msgOrInteraction.guildId ?? "",
  )
  const configs = await Config.getGuildNFTRoleConfigs(
    msgOrInteraction.guildId ?? "",
  )
  if (configs.ok) {
    const { description } = await list(configs)
    return {
      messageOptions: {
        embeds: [
          getSuccessEmbed({
            msg,
            title: `Successfully removed ${name}!`,
            description: `To set a new nft role, run ${await getSlashCommand(
              "role nft set",
            )}.\n\n${description}`,
          }),
        ],
        components: [],
      },
    }
  }
  return {
    messageOptions: { embeds: [getErrorEmbed({ description: configs.error })] },
  }
}
