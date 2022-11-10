import { CommandInteraction } from "discord.js"
import {
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
} from "@discordjs/builders"
import { InternalError, GuildIdNotFoundError } from "errors"
import { composeEmbedMessage2 } from "utils/discordEmbed"
import { SLASH_PREFIX } from "utils/constants"
import { SlashCommand } from "types/common"
import { handle } from "../nft/config"

const CONSUMER_KEY = "consumer_key"
const CONSUMER_KEY_SECRET = "consumer_key_secret"
const ACCESS_TOKEN = "access_token"
const ACCESS_TOKEN_SECRET = "access_token_secret"

const command: SlashCommand = {
  name: "config_twitter-sale",
  category: "Community",
  prepare: () => {
    const ts = new SlashCommandSubcommandBuilder()
      .setName("twitter-sale")
      .setDescription("Config twitter sales bot")
      .addStringOption((option) =>
        option
          .setName(CONSUMER_KEY)
          .setDescription("Your twitter consumer key. Example: J9ts...")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName(CONSUMER_KEY_SECRET)
          .setDescription("Your twitter consumer key secret. Example: hNl8...")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName(ACCESS_TOKEN)
          .setDescription("Your twitter access token. Example: 1450...")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName(ACCESS_TOKEN_SECRET)
          .setDescription("Your twitter access token secret. Example: POvv...")
          .setRequired(true)
      )

    return new SlashCommandSubcommandGroupBuilder()
      .setName("config")
      .setDescription("config")
      .addSubcommand(ts)
  },
  run: async function (interaction: CommandInteraction) {
    if (!interaction.guild || !interaction.guildId) {
      throw new GuildIdNotFoundError({})
    }

    const csmrKey = interaction.options.getString(CONSUMER_KEY)
    const csmrKeyScrt = interaction.options.getString(CONSUMER_KEY_SECRET)
    const acsToken = interaction.options.getString(ACCESS_TOKEN)
    const acsTokenScrt = interaction.options.getString(ACCESS_TOKEN_SECRET)

    if (!csmrKey || !csmrKeyScrt || !acsToken || !acsTokenScrt) {
      throw new InternalError({
        description:
          "Missing arguments. Please enter all 4 Twitter credentials",
      })
    }
    return await handle(
      csmrKey,
      csmrKeyScrt,
      acsToken,
      acsTokenScrt,
      interaction.guildId
    )
  },
  help: async (interaction: CommandInteraction) => ({
    embeds: [
      composeEmbedMessage2(interaction, {
        usage: `${SLASH_PREFIX}nft config twitter-sale <consumer_key> <consumer_key_secret> <access_token> <access_token_secret>`,
        examples: `${SLASH_PREFIX}nft config twitter-sale J9ts... hNl8... 1450... POvv...`,
      }),
    ],
  }),
  colorType: "Marketplace",
}

export default command
