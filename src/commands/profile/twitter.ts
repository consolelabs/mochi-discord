import { Command } from "types/common"
import maskAddress, {
  emojis,
  getEmbedFooter,
  getEmoji,
  getHelpEmbed,
  getListCommands,
} from "utils/discord"
import Profile, { User } from "modules/profile"
import { MessageEmbed } from "discord.js"
import { PREFIX, PROFILE_THUMBNAIL } from "env"
import twitter from "modules/twitter"
import {
  TwitterHandleNotFoundError,
  UserNotFoundError,
  UserNotVerifiedError,
} from "errors"

const command: Command = {
  id: "twitter",
  command: "twitter",
  name: "Twitter",
  category: "Profile",
  run: async function (msg, action) {
    let target
    let user: User

    const args = msg.content.split(" ")
    if (args.length < 2) {
      return { messageOptions: await this.getHelpMessage(msg, action, true) }
    }
    const params: Record<string, string> = {
      address: null,
      discordId: null,
      guildId: null,
      twitterHandle: null,
    }

    params.guildId = msg.guildId
    params.discordId = msg.author.id

    params.twitterHandle = twitter.parseTwitterHandle(args[1])

    if (!params.twitterHandle) {
      throw new TwitterHandleNotFoundError({ message: msg })
    }

    await Profile.updateTwitterHandle({
      discordId: params.discordId,
      twitterHandle: params.twitterHandle,
      guildId: params.guildId,
      isAdminCommand: false,
    })

    user = await Profile.getUser(params)
    if (!target && user?.is_verified) {
      target = await msg.guild.members.fetch(user.discord_id)
    }

    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guild.id,
      })
    }
    if (!user?.is_verified) {
      throw new UserNotVerifiedError({ message: msg, discordId: target.id })
    }

    let userInfoMsg = new MessageEmbed()
      .setColor("#BA1DCA")
      .setTitle("Unknown/Unverified user")
    if (target) {
      userInfoMsg = userInfoMsg
        .setTitle(target.displayName)
        .setThumbnail(
          `https://cdn.discordapp.com/avatars/${target.id}/${target.user.avatar}.png`
        )
        .addFields([
          {
            name: "💳 Address",
            value: `[\`${maskAddress(
              user.address
            )}\`](${"https://pod.town"})\n\u200B`,
          },
          {
            name: `${getEmoji("blank")} Twitter`,
            value: `${getEmoji("twitter")} ${
              user?.twitter_id
                ? `\`${user.twitter_handle || user.twitter_id}\``
                : "**Not connected**"
            }`,
            inline: false,
          },
        ])
    }
    userInfoMsg
      .setFooter(getEmbedFooter([msg.author.tag]), msg.author.avatarURL())
      .setTimestamp()

    return {
      messageOptions: { embeds: [userInfoMsg] },
    }
  },
  getHelpMessage: async function (msg, _action) {
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    const embedMsg = getHelpEmbed()
      .setTitle(`${PREFIX}twitter`)
      .setThumbnail(PROFILE_THUMBNAIL)
      .addField("_Examples_", `\`${PREFIX}twitter pod_town\``, true)
      .setDescription(
        `\`\`\`${"Link twitter to your profile"}.\`\`\`\n${getListCommands(
          replyEmoji ?? "╰ ",
          {
            twitter: {
              command: "twitter",
              name: `Use \`${PREFIX}twitter <@handle | handle | twitter.com/profile>\` to perform this action.`,
            },
          }
        )}`
      )
    return {
      embeds: [embedMsg],
    }
  },
  canRunWithoutAction: true,
}

export default command
