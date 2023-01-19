import Config from "adapters/config"
import { Message, SelectMenuInteraction } from "discord.js"
import { InteractionHandler } from "handlers/discord/select-menu"
import { getSuccessEmbed } from "ui/discord/embed"

export const handler: InteractionHandler = async (msgOrInteraction) => {
  const interaction = msgOrInteraction as SelectMenuInteraction
  const msg = msgOrInteraction as Message
  const [configId, name] = interaction.values[0].split("|")
  await Config.removeGuildTokenRoleConfig(configId)
  return {
    messageOptions: {
      embeds: [
        getSuccessEmbed({
          msg,
          title: `Successfully removed ${name}!`,
          description: `You can set the new role by \`$tokenrole set <role> <amount> <token_address> <chain_name>\``,
        }),
      ],
      components: [],
    },
  }
}
