import config from "adapters/config"
import {
  ButtonInteraction,
  CommandInteraction,
  EmbedFieldData,
} from "discord.js"
import { GuildIdNotFoundError } from "errors"
import { composeEmbedMessage, formatDataTable } from "ui/discord/embed"
import {
  emojis,
  getEmoji,
  getEmojiURL,
  shortenHashOrAddress,
} from "utils/common"
import { DOT } from "utils/constants"

export function renderDefaultRole(data: any) {
  return `${
    data?.role_id ? `\`Role\`${getEmoji("LINE")}<@&${data.role_id}>` : "Unset"
  }`
}

export function renderLevelRole(data: any) {
  if (!data?.length) return "Unset"
  return formatDataTable(
    data.map((d: any) => ({
      lvl: `Lvl. ${d.level}`,
      minXp: `${d.level_config.min_xp}xp+`,
    })),
    {
      cols: ["lvl", "minXp"],
      rowAfterFormatter: (f, i) =>
        `${f}${getEmoji("LINE")}<@&${data[i].role_id}>`,
    }
  ).joined
}

export function renderNftRole(data: any) {
  if (!data?.length) return "Unset"
  return formatDataTable(
    data
      .map((d: any) => {
        return d.nft_collection_configs.map((c: any) => ({
          address: shortenHashOrAddress(c.address),
          symbol: c.symbol,
          amount: `>= ${d.number_of_tokens}`,
        }))
      })
      .flat(),
    {
      cols: ["symbol", "address", "amount"],
      rowAfterFormatter: (f, i) =>
        `${f}${getEmoji("LINE")}<@&${data[i].role_id}>`,
    }
  ).joined
}

export function renderReactionRole(_data: any, guildId: string) {
  if (!_data?.length) return "Unset"
  const data = _data
    .map((d: any) =>
      d.roles.map((c: any) => ({
        reaction: c.reaction,
        role: `<@&${c.id}>`,
        messageUrl: `https://discord.com/channels/${guildId}/${d.channel_id}/${d.message_id}`,
      }))
    )
    .flat()

  return data
    .map(
      (d: any) =>
        `${d.reaction} [\`Message\`](${d.messageUrl})${getEmoji("LINE")}${
          d.role
        }`
    )
    .join("\n")
}

export function renderTokenRole(data: any) {
  if (!data?.length) return "Unset"
  return formatDataTable(
    data
      .map((d: any) => ({
        symbol: d.token.symbol,
        amount: `${d.required_amount}+`,
      }))
      .flat(),
    {
      cols: ["symbol", "amount"],
      rowAfterFormatter: (f, i) =>
        `${f}${getEmoji("LINE")}<@&${data[i].role_id}>`,
    }
  ).joined
}

export enum View {
  DefaultRole = 0,
  LevelRole,
  NftRole,
  ReactionRole,
  TokenRole,
}

export async function render(
  i: CommandInteraction | ButtonInteraction,
  view: View,
  data?: any
) {
  if (!i.guildId) {
    throw new GuildIdNotFoundError({})
  }

  let roles: any = {}

  if (!data) {
    const [defaultRole, levelRole, nftRole, reactionRole, tokenRole] =
      await Promise.all([
        config.getCurrentDefaultRole(i.guildId),
        config.getGuildLevelRoleConfigs(i.guildId),
        config.getGuildNFTRoleConfigs(i.guildId),
        config.listAllReactionRoles(i.guildId),
        config.getConfigTokenRoleList(i.guildId),
      ])

    roles.defaultRole = defaultRole.data
    roles.levelRole = levelRole.data
    roles.nftRole = nftRole.data
    roles.reactionRole = reactionRole.data
    roles.tokenRole = tokenRole.data
  } else {
    roles = data
  }

  const embed = composeEmbedMessage(null, {
    author: ["All role configs", getEmojiURL(emojis.ANIMATED_DIAMOND)],
    description: [
      `Below is the complete list of role config used in this server.`,
      `${DOT} Default role: assign upon joining server.`,
      `${DOT} Level role: assign by level.`,
      `${DOT} NFT role: assign to JPEG collectors.`,
      `${DOT} Reaction role: assign upon message react.`,
      `${DOT} Token role: assign to token holders.`,
      getEmoji("LINE").repeat(10),
    ].join("\n"),
    thumbnail: i.guild?.iconURL(),
  })
  let fields: EmbedFieldData[] = [
    {
      name: "Default role",
      value: renderDefaultRole(roles.defaultRole),
      inline: false,
    },
    {
      name: `${getEmoji("XP")} Level role`,
      value: renderLevelRole(roles.levelRole),
      inline: false,
    },
    {
      name: `${getEmoji("NFTS")} NFT role`,
      value: renderNftRole(roles.nftRole),
      inline: false,
    },
    {
      name: "Reaction role",
      value: renderReactionRole(roles.reactionRole.configs, i.guildId),
      inline: false,
    },
    {
      name: `${getEmoji("ANIMATED_COIN_2", true)} Token role`,
      value: renderTokenRole(roles.tokenRole),
      inline: false,
    },
  ]
  fields = fields.sort((a, b) => {
    if (a.value === "Unset") return 1
    if (b.value === "Unset") return -1
    return 0
  })

  embed.addFields(fields.filter((f) => f.value))

  return {
    msgOpts: {
      embeds: [embed],
    },
  }
}
