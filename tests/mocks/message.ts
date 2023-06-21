import {
  CommandInteraction,
  Guild,
  Interaction,
  Message,
  MessageComponentInteraction,
  SnowflakeUtil,
  TextChannel,
} from "discord.js"
import { mockClient } from "./client"

const mockSnowflake = SnowflakeUtil.generate()
const mockGuild = Reflect.construct(Guild, [
  mockClient,
  {
    discovery_splash: null,
    owner_id: mockSnowflake,
    region: "asd",
    afk_channel_id: null,
    afk_timeout: 60000,
    verification_level: 0,
    default_message_notifications: 0,
    explicit_content_filter: 2,
    roles: [],
    emojis: [],
    features: [],
    mfa_level: 0,
    application_id: mockSnowflake,
    system_channel_id: mockSnowflake,
    system_channel_flags: 1,
    rules_channel_id: null,
    vanity_url_code: null,
    description: null,
    banner: null,
    premium_tier: 0,
    preferred_locale: "en-US",
    public_updates_channel_id: null,
    nsfw_level: 0,
    stickers: [],
    premium_progress_bar_enabled: true,
    hub_type: null,
  },
])

export const mockChannel = Reflect.construct(TextChannel, [
  mockGuild,
  {
    id: mockSnowflake,
    type: "GUILD_TEXT",
    guild: mockGuild,
    client: mockClient,
  },
])

export const mockMessage = Reflect.construct(Message, [
  mockClient,
  {
    id: 0,
    channel_id: 0,
    author: {
      id: 0,
      username: "",
      discriminator: "",
      avatar: null,
    },
    content: "",
    timestamp: "",
    tts: false,
    mention_everyone: false,
    mentions: [],
    mention_roles: [],
    attachment: [],
    embeds: [],
    type: 0,
    channel: mockChannel,
  },
  mockChannel,
])

export const mockInteraction = Reflect.construct(MessageComponentInteraction, [
  mockClient,
  {
    id: mockSnowflake,
    application_id: mockSnowflake,
    type: 3,
    message: mockMessage,
    data: {
      custom_id: "test",
      component_type: 2,
      values: [],
    },
    guild_id: mockSnowflake,
    channel_id: mockSnowflake,
    user: {
      id: mockSnowflake,
    },
  },
])
