import { Message, MessageOptions } from "discord.js"
import { Command, DefaultRoleEvent } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import config from "adapters/config"

const TITLE = "Default role"

const onSetDefaultRole = async (
  roleId: string,
  msg: Message
): Promise<MessageOptions> => {
  let description = ""
  const requestData: DefaultRoleEvent = {
    guild_id: msg.guild.id,
    role_id: roleId
  }
  const res = await config.configureDefaultRole(requestData)
  if (res.success) {
    description = `Role <@&${res.data.role_id}> is now configured as user's default role`
  } else {
    description = `Role <@&${res.data.role_id}> has already been configured, please try to set another one`
  }

  return {
    embeds: [
      composeEmbedMessage(msg, {
        title: TITLE,
        description
      })
    ]
  }
}

const onRemoveDefaultRole = async (msg: Message): Promise<MessageOptions> => {
  let description = ""
  const res = await config.removeDefaultRoleConfig(msg.guild.id)

  if (res.success) {
    description = "Removed default role for newcomers"
  } else {
    description = "Failed to remove default role configuration"
  }

  return {
    embeds: [
      composeEmbedMessage(msg, {
        title: TITLE,
        description
      })
    ]
  }
}

const onShowDefaultRoleInfo = async (msg: Message): Promise<MessageOptions> => {
  const json = await config.getCurrentDefaultRole(msg.guild.id)
  const description = json.success
    ? `Current default role for newcomers is <@&${json.data.role_id}>`
    : "Failed to get current default role for newcomers"

  return {
    embeds: [
      composeEmbedMessage(msg, {
        title: TITLE,
        description
      })
    ]
  }
}

const excuteAction = async (
  args: string,
  msg: Message
): Promise<MessageOptions> => {
  args = args.trim()
  switch (args.toUpperCase()) {
    case "REMOVE":
      return await onRemoveDefaultRole(msg)
    case "INFO":
      return await onShowDefaultRoleInfo(msg)
    default:
      return await onSetDefaultRole(args.replace(/\D/g, ""), msg)
  }
}

const command: Command = {
  id: "defaultrole",
  brief: "Set user's default role when hopping into the server",
  command: "defaultrole",
  aliases: ["dr"],
  category: "Config",
  canRunWithoutAction: true,
  run: async (msg: Message) => {
    const args = getCommandArguments(msg)
    let data: MessageOptions
    args.forEach(async val => {
      if (!val) return
    })
    if (args.length === 2) {
      data = await excuteAction(args[1], msg)

      return {
        messageOptions: data
      }
    }
  },
  getHelpMessage: async (msg: Message) => ({
    embeds: [
      composeEmbedMessage(msg, {
        title: TITLE,
        description: "",
        usage: `${PREFIX}dr @<role_name> - To set a <role_name> as default \n${PREFIX}dr remove - To remove current default role\n${PREFIX}dr info - To show current default role for newcomers`,
        examples: `${PREFIX}dr @Friend\n${PREFIX}dr remove \n${PREFIX}dr info`
      })
    ]
  })
}

export default command
