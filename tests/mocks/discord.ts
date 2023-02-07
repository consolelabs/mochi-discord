import {
  APIApplicationCommandInteraction,
  APIMessageComponentButtonInteraction,
  ApplicationCommandType,
  ChannelType,
  ComponentType,
  InteractionType,
} from "discord-api-types/v9"
import {
  ButtonInteraction,
  Channel,
  Client,
  CommandInteraction,
  Guild,
  GuildChannel,
  GuildMember,
  Intents,
  Message,
  Snowflake,
  SnowflakeUtil,
  TextChannel,
  User,
} from "discord.js"
import {
  RawChannelData,
  RawGuildChannelData,
  RawGuildData,
  RawGuildMemberData,
  RawMessageData,
  RawUserData,
} from "discord.js/typings/rawDataTypes"

class MockDiscord {
  private id!: Snowflake
  private client!: Client
  private guild!: Guild
  private channel!: Channel
  private guildChannel!: GuildChannel
  private textChannel!: TextChannel
  private user!: User
  private guildMember!: GuildMember
  public message!: Message
  public commandInteraction!: CommandInteraction
  public buttonInteraction!: ButtonInteraction

  constructor() {
    this.id = SnowflakeUtil.generate()
    this.mockClient()
    this.mockGuild()
    this.mockChannel()
    this.mockGuildChannel()
    this.mockTextChannel()
    this.mockUser()
    this.mockGuildMember()
    // this.guild.addMember(this.user, { accessToken: "mockAccessToken" })
    this.mockMessage()
    this.mockMessageFunctions()
    this.mockCommandInteraction()
    this.mockButtonInteraction()
  }

  public getClient(): Client {
    return this.client
  }

  public getGuild(): Guild {
    return this.guild
  }

  public getChannel(): Channel {
    return this.channel
  }

  public getGuildChannel(): GuildChannel {
    return this.guildChannel
  }

  public getTextChannel(): TextChannel {
    return this.textChannel
  }

  public getUser(): User {
    return this.user
  }

  public getGuildMember(): GuildMember {
    return this.guildMember
  }

  public getMessage(): Message {
    return this.message
  }

  public cloneMessage(): Message {
    return Object.setPrototypeOf(
      Object.assign({}, this.message),
      Message.prototype
    )
  }

  public cloneCommandInteraction(): CommandInteraction {
    return Object.setPrototypeOf(
      Object.assign({}, this.commandInteraction),
      CommandInteraction.prototype
    )
  }

  public cloneButtonInteraction(): ButtonInteraction {
    return Object.setPrototypeOf(
      Object.assign({}, this.buttonInteraction),
      ButtonInteraction.prototype
    )
  }

  private mockClient(): void {
    this.client = new Client({
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.GUILD_INVITES,
      ],
      partials: ["MESSAGE", "REACTION", "CHANNEL"],
    })
  }

  private mockGuild(): void {
    this.guild = new (Guild as unknown as new (
      client: Client,
      data: RawGuildData
    ) => Guild)(this.client, {
      unavailable: false,
      id: this.id,
      name: "mocked js guild",
      icon: "mocked guild icon url",
      splash: "mocked guild splash url",
      region: "eu-west",
      features: [],
      application_id: "application-id",
      afk_timeout: 60000,
      afk_channel_id: this.id,
      system_channel_id: this.id,
      verification_level: 2,
      explicit_content_filter: 2,
      mfa_level: 0,
      owner_id: this.id,
      roles: [],
      emojis: [],
    })
  }

  private mockChannel(): void {
    this.channel = new (Channel as unknown as new (
      client: Client,
      data: RawChannelData
    ) => Channel)(this.client, {
      id: this.id,
      type: ChannelType.GuildText,
    })
    this.client.channels.resolve = jest.fn().mockReturnValue(this.channel)
  }

  private mockGuildChannel(): void {
    this.guildChannel = new (GuildChannel as unknown as new (
      guild: Guild,
      data: RawGuildChannelData
    ) => GuildChannel)(this.guild, {
      ...this.channel,
      type: ChannelType.GuildText,
      name: "guild-channel",
      position: 1,
      parent_id: "123456789",
      permission_overwrites: [],
    })
  }

  private mockTextChannel(): void {
    this.textChannel = new (TextChannel as unknown as new (
      guild: Guild,
      data: RawGuildChannelData
    ) => TextChannel)(this.guild, {
      ...this.guildChannel,
      topic: "topic",
      nsfw: false,
      last_message_id: "123456789",
      rate_limit_per_user: 0,
      type: ChannelType.GuildText,
    })
  }

  private mockUser(): void {
    this.user = new (User as unknown as new (
      client: Client,
      data: RawUserData
    ) => User)(this.client, {
      id: this.id,
      username: "user username",
      discriminator: "user#0000",
      avatar: "user avatar url",
      bot: false,
    })
  }

  private mockGuildMember(): void {
    this.guildMember = new (GuildMember as unknown as new (
      client: Client,
      data: RawGuildMemberData,
      guild: Guild
    ) => GuildMember)(
      this.client,
      {
        deaf: false,
        mute: false,
        nick: "nick",
        roles: [],
      },
      this.guild
    )
  }

  private mockMessage(): void {
    this.message = new (Message as unknown as new (
      client: Client,
      data: RawMessageData
    ) => Message)(this.client, {
      id: this.id,
      content: "this is the message content",
      pinned: false,
      tts: false,
      nonce: "nonce",
      embeds: [],
      attachments: [],
      edited_timestamp: null,
      reactions: [],
      mentions: [],
      mention_roles: [],
      mention_everyone: true,
      channel_id: this.id,
      author: {
        id: this.id,
        username: "asd",
        discriminator: "1234",
        avatar: null,
      },
      timestamp: "",
      guild_id: this.id,
      type: 0,
    })
  }

  private mockMessageFunctions() {
    this.message.channel.sendTyping = jest.fn()
    this.message.createMessageComponentCollector = jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({ on: jest.fn() }),
    })
    this.message.reply = jest.fn().mockImplementation(() => ({
      catch: jest.fn(),
      ...this.message,
    }))
    this.message.removeAttachments = jest.fn()
    this.message.edit = jest.fn()
  }

  private mockCommandInteraction(): void {
    this.commandInteraction = new (CommandInteraction as unknown as new (
      client: Client,
      data: APIApplicationCommandInteraction
    ) => CommandInteraction)(this.client, {
      application_id: "application-id",
      channel_id: this.textChannel.id,
      guild_id: this.guild.id,
      guild_locale: "en-US",
      id: this.id,
      token: "token",
      version: 1,
      type: InteractionType.ApplicationCommand,
      locale: "en-US",
      user: {
        id: this.user.id,
        username: this.user.username,
        avatar: this.user.avatar,
        discriminator: this.user.discriminator,
      },
      data: {
        id: this.id,
        // target_id: "target-id",
        type: ApplicationCommandType.ChatInput,
        name: "name",
        // custom_id: "custom-id",
      },
    })
    this.commandInteraction.reply = jest.fn()
  }

  private mockButtonInteraction(): void {
    this.buttonInteraction = new (ButtonInteraction as unknown as new (
      client: Client,
      // data: APIMessageButtonInteractionData
      data: APIMessageComponentButtonInteraction
    ) => ButtonInteraction)(this.client, {
      id: "id",
      application_id: "application-id",
      // custom_id: "custom-id",
      // component_type: ComponentType.Button,
      channel_id: this.textChannel.id,
      guild_id: this.guild.id,
      data: {
        custom_id: "custom-id",
        component_type: ComponentType.Button,
      },
      token: "token",
      version: 1,
      type: InteractionType.MessageComponent,
      locale: "en-US",
      message: {
        id: this.id,
        content: "this is the message content",
        pinned: false,
        tts: false,
        nonce: "nonce",
        embeds: [],
        attachments: [],
        edited_timestamp: null,
        reactions: [],
        mentions: [],
        mention_roles: [],
        mention_everyone: true,
        channel_id: this.id,
        author: {
          id: this.id,
          username: "asd",
          discriminator: "1234",
          avatar: null,
        },
        timestamp: "",
        type: 0,
      },
    })
  }
}

export default new MockDiscord()
