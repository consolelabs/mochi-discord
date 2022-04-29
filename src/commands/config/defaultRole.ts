import { Message, MessageOptions } from "discord.js"
import { Command, DefaultRoleEvent } from "types/common"
import { composeEmbedMessage } from "utils/discordEmbed"
import { getCommandArguments } from "utils/commands"
import { PREFIX } from "utils/constants"
import config from "adapters/config"

const TITLE = "Default role"

const getRoleNameById = (msg: Message, roleId: string) => {
  return msg.guild.roles.cache.find(r => r.id === roleId).name
}

const onSetDefaultRole = async (roleId: string, msg: Message): Promise<MessageOptions> => {
  let description = ""
  const requestData: DefaultRoleEvent = {
    guild_id: msg.guild.id,
    role_id: roleId
  }
  const res = await config.configureDefaultRole(requestData)
  if (res.success) {
    description = `Role **${getRoleNameById(
      msg,
      requestData.role_id
    )}** is now configured as user's default role`
  } else {
    description = `Role **${getRoleNameById(
      msg,
      requestData.role_id
    )}** has already been configured, please try to set another one`
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
    description = 'Default role is currently unset'
  } else {
    description = 'Failed to unset default role configuration'
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

const getProperAction = (args: string): string => {
  args = args.trim()
  switch (args.toUpperCase()) {
    case "REMOVE":
      return ''
    default:
      return args.replace(/\D/g, "")
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
      const val = getProperAction(args[1])

      if (val) {
        data = await onSetDefaultRole(val, msg)
      } else {
        data = await onRemoveDefaultRole(msg)
      }

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
        usage: `${PREFIX}dr @<role_name> - To set a <role_name> as default \n${PREFIX}dr remove - To unset current default role`,
        examples: `${PREFIX}dr 967013125847121973\n${PREFIX}dr remove`
      })
    ]
  })
}

export default command
