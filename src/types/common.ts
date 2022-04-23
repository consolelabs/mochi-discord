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
  name: string
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
  alias?: string[]
  canRunWithoutAction?: boolean
  // can only run in admin channels & won't be shown in `$help` message
  experimental?: boolean
  inactivityTimeout?: number
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
}

export type ReactionRoleConfigResponse = {
  data: ReactionRoleConfig[]
}

export type ReactionRoleConfig = {
  guild_id: string,
  channel_id: string,
  title: string,
  title_url: string,
  thumbnail_url: string,
  description: string,
  footer_image: string,
  footer_message: string,
  message_id: string,
  reaction_roles: string
}

export type ReactionRole = {
  role_id: string,
  role_name: string,
  reaction: string,
}
