import { Command } from "types/common"
import maskAddress, {
  composeDiscordExitButton,
  composeDiscordSelectionRow,
  composeSimpleSelection,
  emojis,
  getEmbedFooter,
  getEmoji,
  getHeader,
  getHelpEmbed,
  getListCommands,
  getUserInfoParams,
  onlyRunInAdminGroup,
  thumbnails,
} from "utils/discord"
import Profile, { User } from "modules/profile"
import { MessageEmbed } from "discord.js"
import { ADMIN_PREFIX, PREFIX } from "env"
import { UserNotFoundError, UserNotVerifiedError } from "errors"
import handler from "./profile"
import { createCanvas, loadImage } from "canvas"

function getXpProgressBar(
  xp: number,
  faction: "rebellio" | "imperial" | "academy" | "merchant"
) {
  //pgBar emojis
  const startEmoji = getEmoji(`XP_${faction}_LEFT`, true)
  const midEmoji = getEmoji(`XP_${faction}`, true)
  const endEmoji = getEmoji(`XP_${faction}_RIGHT`, true)
  const emptyStartEmoji = getEmoji("XP_BAR_LEFT")
  const emptyMidEmoji = getEmoji("XP_BAR")
  const emptyEndEmoji = getEmoji("XP_BAR_RIGHT")

  const targetXp = Math.max(Math.ceil(xp / 1000) * 1000, 1000)
  const pgBarLgth = 8
  const pgBarBodyLgth = pgBarLgth - 2
  const completedLgth = Math.min(
    Math.floor((xp / targetXp) * pgBarBodyLgth),
    pgBarBodyLgth
  )
  const incompletedLgth = pgBarBodyLgth - completedLgth

  const pgBarStart = completedLgth === 0 ? emptyStartEmoji : startEmoji
  const pgBarEnd = completedLgth === pgBarLgth ? endEmoji : emptyEndEmoji
  const pgBarCompleted = `${midEmoji}`.repeat(completedLgth)
  const pgBarIncompleted = `${emptyMidEmoji}`.repeat(incompletedLgth)
  const pgBarMid = `${pgBarCompleted}${pgBarIncompleted}`

  return `${pgBarStart}${pgBarMid}${pgBarEnd}\n${xp} / ${targetXp}`
}

const command: Command = {
  id: "profile",
  command: "profile",
  name: "Profile",
  category: "Profile",
  checkBeforeRun: async (msg) => {
    if (msg.content.startsWith(ADMIN_PREFIX)) {
      return await onlyRunInAdminGroup(msg)
    }
    return true
  },
  run: async function (msg, action, isAdmin) {
    const beta = await onlyRunInAdminGroup(msg)
    let target
    let user: User
    let params: Record<string, string>

    if (isAdmin) {
      const args = msg.content.split(" ")
      if (args.length < 2) {
        return { messageOptions: await this.getHelpMessage(msg, action, true) }
      }
      params = await getUserInfoParams(args, msg, action)

      params.guildId = msg.guildId
      user = await Profile.getUser(params)
      if (!target && user?.is_verified) {
        target = await msg.guild.members.fetch(user.discord_id)
      }
    } else {
      target = await msg.guild.members.fetch(msg.author.id)
      user = await Profile.getUser({
        discordId: target.id,
        guildId: msg.guildId,
      })
    }
    if (!user) {
      throw new UserNotFoundError({
        message: msg,
        guildId: msg.guild.id,
      })
    }
    if (!user?.is_verified) {
      throw new UserNotVerifiedError({
        message: msg,
        discordId: isAdmin ? params.discordId : target.id,
      })
    }

    let userInfoMsg = new MessageEmbed()
      .setColor("#BA1DCA")
      .setDescription("**Unknown/Unverified user**")

    if (target) {
      let nobilityXp = getXpProgressBar(user?.xps.nobility_xp, "imperial")
      let fameXp = getXpProgressBar(user?.xps.fame_xp, "rebellio")
      let loyaltyXp = getXpProgressBar(user?.xps.loyalty_xp, "merchant")
      let reputationXp = getXpProgressBar(user?.xps.reputation_xp, "academy")
      let globalXp =
        user?.xps.nobility_xp +
        user?.xps.fame_xp +
        user?.xps.loyalty_xp +
        user?.xps.reputation_xp

      let userAddr =
        user.nom_record && user.nom_record.length !== 0
          ? user.nom_record
          : user.ens_record
      userAddr =
        userAddr && userAddr.length !== 0 ? userAddr : maskAddress(user.address)

      userInfoMsg = userInfoMsg
        .setDescription("**Profile**")
        .addFields([
          {
            name: `${getEmoji("blank")} Global XP`,
            value: `${getEmoji("star")} ${globalXp} exp points\n\u200B`,
            inline: true,
          },
          {
            name: `${getEmoji("blank")} Global Rank`,
            value: "-",
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          },
          {
            name: `${getEmoji("blank")} Address`,
            value: `${getEmoji("address")} [\`${userAddr}\`]${
              isAdmin
                ? `(https://wallet.pod.town/${user.address})`
                : "(https://pod.town/)"
            }\n\u200B`,
            inline: true,
          },
          {
            name: `${getEmoji("blank")} Twitter`,
            value: `${getEmoji("twitter")} ${
              user?.twitter_id
                ? `[${
                    user.twitter_name || user.twitter_handle
                  }](https://twitter.com/i/user/${user.twitter_id})`
                : "**Not connected**"
            }\n\u200B`,
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          },
          {
            name: `${getEmoji("imperial")} Imperio`,
            value: nobilityXp,
            inline: true,
          },
          {
            name: `${getEmoji("rebellio")} Rebellio`,
            value: fameXp,
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          },
          {
            name: `${getEmoji("merchant")} Mercanto`,
            value: loyaltyXp,
            inline: true,
          },
          {
            name: `${getEmoji("academy")} Academia`,
            value: reputationXp,
            inline: true,
          },
          {
            name: "\u200B",
            value: "\u200B",
            inline: true,
          },
          ...(beta
            ? [
                {
                  name: `${getEmoji("blank")}`,
                  value: composeSimpleSelection([
                    "View wallet asset allocation",
                    "View your wallet activity log",
                  ]),
                  inline: false,
                },
              ]
            : []),
        ])
        .setFooter(
          getEmbedFooter([
            beta ? 'React or type "exit" to close!' : msg.author.tag,
          ]),
          msg.author.avatarURL()
        )
        .setTimestamp()
    }
    const selectRow = composeDiscordSelectionRow({
      customId: "profile_view_option",
      placeholder: "Make a selection",
      options: [
        {
          label: "View wallet asset allocation",
          value: "profile_wallet_asset_allocation",
          emoji: getEmoji("num_1"),
        },
        {
          label: "View your activity log",
          value: "profile_activity",
          emoji: getEmoji("num_2"),
        },
      ],
    })

    const exitBtnRow = composeDiscordExitButton()

    let canvas, offset, context, frame, avatar
    canvas = createCanvas(600, 600)
    offset = 20
    context = canvas.getContext("2d")
    frame = await loadImage("./src/assets/rainbow_frame_200.png")

    let userAvatarUrl =
      user.avatar.thumbnail_cdn ??
      `https://cdn.discordapp.com/avatars/${target.id}/${target.user.avatar}.png`
    if (!target.user.avatar) {
      userAvatarUrl = "https://cdn.discordapp.com/embed/avatars/0.png"
    }
    avatar = await loadImage(userAvatarUrl)
    context.drawImage(
      avatar,
      offset,
      offset,
      canvas.width - offset * 2,
      canvas.height - offset * 2
    )
    context.drawImage(frame, 0, 0, canvas.width, canvas.height)
    userInfoMsg.setThumbnail("attachment://frame.png")

    return {
      messageOptions: {
        files: [{ attachment: canvas.toBuffer(), name: "frame.png" }],
        content: getHeader(
          "Viewing profile for",
          isAdmin ? target.user : msg.author
        ),
        embeds: [userInfoMsg],
        ...(beta
          ? {
              components: [selectRow, exitBtnRow],
            }
          : {}),
      },
      ...(beta
        ? {
            commandChoiceOptions: {
              userId: msg.author.id,
              guildId: msg.guildId,
              channelId: msg.channelId,
              timeout: this.inactivityTimeout,
              handler,
            },
          }
        : {}),
    }
  },
  getHelpMessage: async function (msg, _action, isAdmin) {
    const replyEmoji = msg.client.emojis.cache.get(emojis.REPLY)
    let embedMsg = getHelpEmbed()
      .setTitle(`${isAdmin ? ADMIN_PREFIX : PREFIX}profile`)
      .setThumbnail(thumbnails.PROFILE)
      .addField(
        "_Examples_",
        `\`${isAdmin ? ADMIN_PREFIX : PREFIX}profile\``,
        true
      )
      .setDescription(
        `\`\`\`${
          isAdmin ? "Query information about a user" : "See your profile"
        }.\`\`\`\n${getListCommands(replyEmoji ?? "╰ ", {
          profile: {
            command: "profile",
            name: `Use \`${isAdmin ? ADMIN_PREFIX : PREFIX}profile${
              isAdmin
                ? " <address | username | username#discriminator | twitter @username twitter_handle >"
                : ""
            }\` to perform this action.`,
          },
        })}`
      )
    return { embeds: [embedMsg] }
  },
  canRunWithoutAction: true,
  isComplexCommand: true,
  alias: ["pro", "prof", "pf", "profiel"],
}

export default command
