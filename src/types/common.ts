import { ColorResolvable, Message, MessageOptions, User } from "discord.js"
import { SetOptional } from "type-fest"
import { CommandChoiceHandlerOptions } from "utils/CommandChoiceManager"

// Category of commands
export type Category = "Profile" | "Defi" | "Config" | "Community"

// All command must conform to this type
export type Command = {
  id: string
  command: string
  category: Category
  brief: string
  checkBeforeRun?: (msg: Message) => Promise<boolean>
  run: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<{
    messageOptions: MessageOptions
    commandChoiceOptions?: SetOptional<CommandChoiceHandlerOptions, "messageId">
  } | void>
  getHelpMessage: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<MessageOptions>
  aliases?: string[]
  canRunWithoutAction?: boolean
  // can only run in admin channels & won't be shown in `$help` message
  experimental?: boolean
  actions?: Record<string, Command>
}

export type EmbedProperties = {
  title?: string
  description?: string
  thumbnail?: string
  color?: string | ColorResolvable
  footer?: string[]
  timestamp?: Date | null
  image?: string
  author?: string[]
  originalMsgAuthor?: User
  usage?: string
  examples?: string
}

export type Role = {
  id: string
  name: string
  reaction: string
}
export type ReactionRoleResponse = {
  guild_id: string
  message_id: string
  role: Role
}

export type RoleReactionEvent = {
  guild_id: string
  message_id: string
  reaction: string
  role_id?: string
}

export type RoleReactionConfigResponse = {
  guild_id: string
  message_id: string
  roles: Role[]
  success: boolean
}

export type DefaultRoleEvent = {
  guild_id: string,
  role_id: string
}

export type DefaultRole = {
  role_id: string,
  guild_id: string
}

export type DefaultRoleResponse = {
  data: DefaultRole,
  success: boolean
}
