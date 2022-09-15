import profile from "adapters/profile"
import { Message, User } from "discord.js"
import { Command } from "types/common"
import { composeEmbedMessage, getErrorEmbed } from "utils/discordEmbed"
import { PREFIX, PROFILE_GITBOOK } from "utils/constants"
import { getEmoji, hasAdministrator, shortenHashOrAddress } from "utils/common"
import { parseDiscordToken, getCommandArguments } from "utils/commands"

function buildProgressbar(progress: number): string {
  const list = new Array(7).fill(getEmoji("faction_exp_2"))
  list[0] = getEmoji("faction_exp_1")
  list[list.length - 1] = getEmoji("faction_exp_3")

  return list
    .map((_, i) => {
      if (Math.floor(progress * 7) >= i + 1) {
        switch (i) {
          case 0:
            return getEmoji("xp_filled_left", true)
          case 6:
            return getEmoji("xp_filled_right", true)
          default:
            return getEmoji("xp_filled", true)
        }
      }
      return _
    })
    .join("")
}

function buildXPbar(name: string, value: number) {
  const cap = Math.ceil(value / 1000) * 1000
  const list = new Array(7).fill(getEmoji("faction_exp_2"))
  list[0] = getEmoji("faction_exp_1")
  list[list.length - 1] = getEmoji("faction_exp_3")

  return `${list
    .map((_, i) => {
      if (Math.floor((value / cap) * 7) >= i + 1) {
        return i === 0
          ? getEmoji(`${name}_exp_1`, true)
          : getEmoji(`${name}_exp_2`, true)
      }
      return _
    })
    .join("")}\n\`${value}/${cap}\``
}

async function composeMyProfileEmbed(
  msg: Message,
  user: User,
  shouldHidePrivateInfo = false
) {
  const userProfileResp = await profile.getUserProfile(
    msg.guildId ?? "",
    user.id
  )
  if (!userProfileResp.ok) {
    return getErrorEmbed({
      msg,
      description: userProfileResp.error,
    })
  }

  const userProfile = userProfileResp.data
  let addressStr = userProfile.user_wallet?.address ?? ""
  addressStr = addressStr.length ? shortenHashOrAddress(addressStr) : "N/A"

  const lvlMax = 100
  const lvlStr = `\`${userProfile.current_level?.level}/${lvlMax}\``
  const levelProgress = buildProgressbar(
    (userProfile.current_level?.level ?? 0) / lvlMax
  )
  const nextLevelMinXp = userProfile.next_level?.min_xp
    ? userProfile.next_level?.min_xp
    : userProfile.current_level?.min_xp

  const xpProgress = buildProgressbar(
    (userProfile?.guild_xp ?? 0) / (nextLevelMinXp ?? 1)
  )

  const xpStr = `\`${userProfile.guild_xp}/${nextLevelMinXp}\``

  const walletValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const protocolValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const nftValue = shouldHidePrivateInfo ? "`$**`" : "`NA`"
  const assetsStr = `Wallet: ${walletValue}\nProtocol: ${protocolValue}\nNFT: ${nftValue}`
  const highestRole =
    msg.member?.roles.highest.name !== "@everyone"
      ? msg.member?.roles.highest
      : null

  const roleStr = highestRole?.id ? `<@&${highestRole.id}>` : "`N/A`"
  const activityStr = `${getEmoji("FLAG")} \`${userProfile.nr_of_actions}\``
  const rankStr = `:trophy: \`${userProfile.guild_rank ?? 0}\``

  const embed = composeEmbedMessage(msg, {
    thumbnail: user.displayAvatarURL(),
    author: [`${user.username}'s profile`, user.displayAvatarURL()],
  }).addFields(
    { name: "Rank", value: rankStr, inline: true },
    { name: "Address", value: `\`${addressStr}\``, inline: true },
    {
      name: "Assets",
      value: assetsStr,
      inline: true,
    },
    { name: "Role", value: roleStr, inline: true },
    { name: "Activities", value: activityStr, inline: true },
    {
      name: getEmoji("blank"),
      value: getEmoji("blank"),
      inline: true,
    },
    {
      name: "Engagement Level",
      value: `${levelProgress}\n${lvlStr}`,
      inline: true,
    },
    {
      name: "Engagement XP",
      value: `${xpProgress}\n${xpStr}`,
      inline: true,
    },
    {
      name: getEmoji("blank"),
      value: getEmoji("blank"),
      inline: true,
    },
    {
      name: `${getEmoji("imperial")} Nobility`,
      value: buildXPbar(
        "imperial",
        userProfileResp.data.user_faction_xps?.imperial_xp ?? 0
      ),
      inline: true,
    },
    {
      name: `${getEmoji("rebelio")} Fame`,
      value: buildXPbar(
        "rebelio",
        userProfileResp.data.user_faction_xps?.rebellio_xp ?? 0
      ),
      inline: true,
    },
    {
      name: getEmoji("blank"),
      value: getEmoji("blank"),
      inline: true,
    },
    {
      name: `${getEmoji("mercanto")} Loyalty`,
      value: buildXPbar(
        "mercanto",
        userProfileResp.data.user_faction_xps?.merchant_xp ?? 0
      ),
      inline: true,
    },
    {
      name: `${getEmoji("academia")} Reputation`,
      value: buildXPbar(
        "academia",
        userProfileResp.data.user_faction_xps?.academy_xp ?? 0
      ),
      inline: true,
    },
    {
      name: getEmoji("blank"),
      value: getEmoji("blank"),
      inline: true,
    }
  )

  return embed
}

const command: Command = {
  id: "profile",
  command: "profile",
  brief: "User’s profile",
  category: "Profile",
  run: async (msg) => {
    const shouldHidePrivateInfo = !hasAdministrator(msg.member)

    // get users
    const users: User[] = []
    const args = getCommandArguments(msg)
    if (args.length > 1) {
      const { isUser, id } = parseDiscordToken(args[1])
      if (isUser) {
        const cachedUser = msg.guild?.members.cache.get(id)?.user
        if (cachedUser) {
          users.push(cachedUser)
        }
      } else {
        const usersFoundByDisplayname: User[] = []
        const usersFoundByUsername: User[] = []
        await msg.guild?.members?.fetch()?.then((members) => {
          members.forEach((member) => {
            if (member.user.username === args[1]) {
              usersFoundByUsername.push(member.user)
            } else if (member.displayName === args[1]) {
              usersFoundByDisplayname.push(member.user)
            }
          })
        })

        users.push(...usersFoundByUsername, ...usersFoundByDisplayname)
      }
    } else {
      users.push(msg.author)
    }

    for (const user of users.values()) {
      await msg.reply({
        embeds: [await composeMyProfileEmbed(msg, user, shouldHidePrivateInfo)],
      })
    }

    if (users.length == 0) {
      return {
        messageOptions: {
          embeds: [
            getErrorEmbed({
              msg,
              description: "No profile found",
            }),
          ],
        },
      }
    }
  },
  getHelpMessage: async (msg) => {
    return {
      embeds: [
        composeEmbedMessage(msg, {
          examples: `${PREFIX}profile\n${PREFIX}profile @Mochi Bot\n${PREFIX}profile John`,
          usage: `${PREFIX}profile\n${PREFIX}profile <user>`,
          description:
            "Display your and other users' profiles along with NFT collections",
          footer: [`Type ${PREFIX}profile to check your profile`],
          document: PROFILE_GITBOOK,
        }),
      ],
    }
  },
  canRunWithoutAction: true,
  colorType: "Profile",
}

export default command
