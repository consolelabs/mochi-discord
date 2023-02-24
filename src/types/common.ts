import {
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import {
  ButtonInteraction,
  ColorResolvable,
  CommandInteraction,
  Interaction,
  Message,
  MessageCollectorOptionsParams,
  MessageEditOptions,
  MessageOptions,
  MessageSelectOptionData,
  User,
  WebhookEditMessageOptions,
} from "discord.js"
import { InteractionOptions } from "handlers/discord/select-menu"

// Category of commands
export type Category = "Profile" | "Defi" | "Config" | "Community" | "Game"
export type ColorType =
  | "Profile"
  | "Server"
  | "Marketplace" // for sales bot commands
  | "Market" // for showing NFT market-data commands
  | "Defi"
  | "Command"
  | "Game"

export const embedsColors: Record<string, string> = {
  Profile: "#62A1FE",
  Server: "#62A1FE",
  Marketplace: "#FFDE6A",
  Market: "#848CD9",
  Defi: "#9FFFE4",
  Command: "#62A1FE",
  Game: "#FFAD83",
}

export type SlashCommandChoiceOption = {
  name: string
  description: string
  required: boolean
  choices: [string, string][]
}

export type RunResult<T = MessageOptions | MessageEditOptions> = {
  messageOptions: T
  interactionOptions?: InteractionOptions
  replyMessage?: WebhookEditMessageOptions
  buttonCollector?: {
    handler: (i: ButtonInteraction) => Promise<any> | Promise<void>
    options?: MessageCollectorOptionsParams<"BUTTON">
  }
}

export type SetDefaultRenderList<T> = (p: {
  msgOrInteraction: T
  value: string
}) => Promise<any>

export type SetDefaultButtonHandler = (i: ButtonInteraction) => Promise<void>

export type MultipleResult<T> = {
  // the select menu
  select: {
    placeholder?: string
    options: MessageSelectOptionData[]
  }
  // e.g "...we found multiple values for {ambiguousResultText}..."
  ambiguousResultText: string
  // e.g "...some multiple results such as {multipleResultText}"
  multipleResultText: string
  // handler to run when the admin confirm to set default
  onDefaultSet?: SetDefaultButtonHandler
  // this function is used to render the actual embed with data when the admin
  // choose one of the option in the select menu
  render?: SetDefaultRenderList<T>
  fullCommand?: string
}

type CommandResponse<T> =
  | RunResult<MessageOptions>
  | MultipleResult<T>
  | void
  | null
  | undefined

export type TextCommandResponse = CommandResponse<Message>
export type SlashCommandResponse = CommandResponse<CommandInteraction>

export type SlashCommand = {
  name: string
  category: Category
  onlyAdministrator?: boolean
  prepare: (
    slashCommands?: Record<string, SlashCommand>
  ) =>
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandBuilder
    | SlashCommandSubcommandGroupBuilder
  run: (
    interaction: CommandInteraction
  ) => Promise<CommandResponse<CommandInteraction>>
  help: (interaction: CommandInteraction) => Promise<MessageOptions>
  ephemeral?: boolean
  colorType: ColorType
}

// TODO: remove after slash command migration done
export type Command = {
  id: string
  command: string
  category: Category
  brief: string
  featured?: {
    title: string
    description: string
  }
  onlyAdministrator?: boolean
  run: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<CommandResponse<Message>>
  getHelpMessage: (
    msg: Message,
    action?: string,
    isAdmin?: boolean
  ) => Promise<MessageOptions>
  aliases?: string[]
  canRunWithoutAction?: boolean
  // can only run in admin channels
  experimental?: boolean
  actions?: Record<string, Command>
  allowDM?: boolean
  colorType: ColorType
  minArguments?: number
}

export type EmbedProperties = {
  title?: string
  description?: string
  thumbnail?: string | null
  color?: string | ColorResolvable
  footer?: string[]
  timestamp?: Date | null
  image?: string
  author?: Array<string | null | undefined>
  originalMsgAuthor?: User
  usage?: string
  examples?: string
  withoutFooter?: boolean
  includeCommandsList?: boolean
  actions?: Record<string, Command>
  document?: string
}

// TODO: move all below
export type DefaultRoleEvent = {
  guild_id: string
  role_id: string
}

export type DefaultRole = {
  role_id: string
  guild_id: string
}

export type DefaultRoleResponse = {
  data: DefaultRole
  success: boolean
}

export type RepostReactionRequest = {
  guild_id: string
  emoji: string
  quantity?: number | 0
  repost_channel_id?: string | ""
}

export type Pagination = {
  page: number
  size: number
  total: number
}

export type RequestConfigRepostReactionConversation = {
  emoji_start?: string
  emoji_stop?: string
  guild_id?: string
  repost_channel_id?: string
}

export type BlacklistChannelRepostConfigRequest = {
  guild_id: string
  channel_id: string
}

export type KafkaQueueMessage = {
  platform: string
  data: KafkaQueueMessageData
}

export type KafkaQueueMessageData = {
  command: string
  subcommand: string
  full_text_command: string
  command_type: string
  channel_id: string
  guild_id: string
  author_id: string
  execution_time_ms: number
  success: boolean
  message?: Message | null
  interaction?: Interaction | null
}
