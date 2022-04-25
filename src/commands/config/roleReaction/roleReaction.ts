import { Message } from "discord.js";
import { Command, RoleReactionConfigResponse, RoleReactionEvent } from "types/common"
import { composeEmbedMessage } from "utils/discord-embed"
import reactionRole from "adapters/reactionRole";
import { getCommandArguments } from "utils/common";
import { logger } from "logger";
import { PREFIX } from "utils/constants";

const getRoleNameById = (msg: Message, roleId: string) => {
  return msg.guild.roles.cache.find(r => r.id === roleId).name
}

const getHelpMessage = async (msg: Message) => {
  const embed = composeEmbedMessage(msg, {
    description: "Configure reaction role",
  }).addField("_Usage_", `\`${PREFIX}reactionrole <message_id> <emoji> <role_id>\`\n`)
  .addField("_Alias_", `\`${PREFIX}rr <message_id> <emoji> <role_id>\`\n`)
  
  return {
    embeds: [embed],
  }
}

const command: Command = {
  id: "reaction",
  name: "Setup reaction emoji for users to self-assign their roles",
  command: "reactionrole",
  alias: ["rr"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    let description = ''
    args.forEach(async val => {
      if (!val) return
    })
    if (args.length === 4) {
      const requestData: RoleReactionEvent = {
        guild_id: msg.guild.id,
        message_id: args[1],
        reaction: args[2],
        role_id: args[3]
      }
      const config: RoleReactionConfigResponse = await reactionRole.updateReactionConfig(requestData)
      logger.info(config)
      if (config.success) {
        description = `Successfully configure emoji ${requestData.reaction} as reaction for role ${getRoleNameById(msg, requestData.role_id)}`
      } else {
        description = `Oops, this role was already configured`
      }
      return {
        messageOptions: {
          embeds: [composeEmbedMessage(msg, {
            description,
          })]
        }
      }
    }
  },
  getHelpMessage,
  experimental: true,
}

export default command