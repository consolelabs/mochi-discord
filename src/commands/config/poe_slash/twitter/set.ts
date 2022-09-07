import config from "adapters/config"
import { Channel } from "discord.js"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { getMessageBody } from "./list"
import TwitterStream from "utils/TwitterStream"
import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { CommandInteraction } from "discord.js"

export const fromPrefix = "from:"
const hashtagPrefix = "#"
const handlePrefix = "@"
const channelPrefix = "<#"
const rolePrefix = "<@&"
const twitterAccountLinkPrefix = "https://twitter.com/"
const twitterAccountLinkRegex = new RegExp("https://twitter.com/(.+)")

export async function twitterSet(interaction: CommandInteraction) {
  if (!interaction.guildId || !interaction.guild) {
    return {
      messageOptions: {
        embeds: [
          getErrorEmbed({
            description: "This command must be run in a Guild",
          }),
        ],
      },
    }
  }

  const logChannelArg = interaction.options.getString("channel", true)
  if (
    !logChannelArg.startsWith(channelPrefix) ||
    !logChannelArg.endsWith(">")
  ) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "Invalid channel" })],
      },
    }
  }

  const logChannel = logChannelArg.substring(2, logChannelArg.length - 1)
  const chan: Channel | null = await interaction.guild.channels
    .fetch(logChannel)
    .catch(() => null)
  if (!chan) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "Channel not found" })],
      },
    }
  } else if (!chan.isText()) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "Channel must be text-based" })],
      },
    }
  }

  let triggerKeywords =
    interaction.options.getString("keywords", true).split(",") ?? []
  triggerKeywords = triggerKeywords.map((t) => t.trim())

  if (triggerKeywords.length === 0 || triggerKeywords.some((t) => !t)) {
    return {
      messageOptions: {
        embeds: [getErrorEmbed({ description: "Empty keyword list" })],
      },
    }
  }

  for (const trigger of triggerKeywords) {
    if (
      [
        hashtagPrefix,
        handlePrefix,
        channelPrefix,
        rolePrefix,
        twitterAccountLinkPrefix,
        fromPrefix,
      ].every((prefix) => !trigger.startsWith(prefix))
    ) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              description:
                "Invalid keyword format, run `$help poe twitter set` to see supported formats",
            }),
          ],
        },
      }
    }
  }

  // normalize hashtag that get treated as discord channels or
  // user handle that get treated as discord role
  triggerKeywords = await Promise.all(
    triggerKeywords.map(async (keyword) => {
      switch (true) {
        case keyword.startsWith(twitterAccountLinkPrefix) &&
          twitterAccountLinkRegex.test(keyword): {
          const handle = twitterAccountLinkRegex.exec(keyword)?.[1]
          return handlePrefix + handle
        }
        case keyword.startsWith(fromPrefix) &&
          twitterAccountLinkRegex.test(keyword.slice(fromPrefix.length)): {
          const handle = twitterAccountLinkRegex.exec(
            keyword.slice(fromPrefix.length)
          )?.[1]
          return fromPrefix + handle
        }
        case [channelPrefix, rolePrefix].some((p) => keyword.startsWith(p)) &&
          keyword.endsWith(">"): {
          if (keyword.startsWith(channelPrefix)) {
            const id = keyword.substring(2, keyword.length - 1)
            const chan = await interaction.guild?.channels.fetch(id)
            return hashtagPrefix + chan?.name
          } else {
            const id = keyword.substring(3, keyword.length - 1)
            const role = await interaction.guild?.roles.fetch(id)
            return handlePrefix + role?.name
          }
        }
        default:
          return keyword
      }
    })
  )

  const ruleId = await TwitterStream.upsertRule({
    ruleValue: triggerKeywords,
    channelId: chan.id,
    guildId: interaction.guildId,
  })

  if (ruleId) {
    await config.setTwitterConfig({
      guild_id: interaction.guildId,
      hashtag: triggerKeywords.filter((k) => k.startsWith(hashtagPrefix)),
      twitter_username: triggerKeywords.filter((k) =>
        k.startsWith(handlePrefix)
      ),
      from_twitter: triggerKeywords.filter((k) => k.startsWith(fromPrefix)),
      user_id: interaction.user.id,
      channel_id: chan.id,
      rule_id: ruleId,
    })
  }

  return {
    messageOptions: {
      embeds: [
        composeEmbedMessage(null, {
          author: [interaction.guild.name, interaction.guild.iconURL()],
          description: getMessageBody({
            user_id: interaction.user.id,
            channel_id: chan.id,
            hashtag: triggerKeywords.filter((k) => k.startsWith(hashtagPrefix)),
            twitter_username: triggerKeywords.filter((k) =>
              k.startsWith(handlePrefix)
            ),
            from_twitter: triggerKeywords.filter((k) =>
              k.startsWith(fromPrefix)
            ),
          }),
        }),
      ],
    },
  }
}

export const set = new SlashCommandSubcommandBuilder()
  .setName("set")
  .setDescription("Set/overwrite a guild's twitter PoE config")
  .addStringOption((option) =>
    option
      .setName("channel")
      .setDescription("the channel which you wanna log twitters' activities.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("keywords")
      .setDescription("the keywords which you wanna log twitters' activities.")
      .setRequired(true)
  )
