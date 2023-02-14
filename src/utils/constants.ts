import {
  API_SERVER_HOST,
  PT_API_SERVER_HOST,
  INDEXER_API_SERVER_HOST,
} from "env"

export const DOT = "•"
export const COMMA = ","
export const SPACE = " "
export const SPACES_REGEX = / +/g
export const EMPTY = ""
export const VERTICAL_BAR = "|"

export const PREFIX = "$"
export const SLASH_PREFIX = "/"
export const HELP = "help"
export const HELP_CMD = `${PREFIX}${HELP}`

export const PROFILE_THUMBNAIL =
  "https://cdn.discordapp.com/emojis/916737804384485447.png?size=240"

export const DEFI_DEFAULT_FOOTER = `Use ${PREFIX}tokens for a list of supported tokens`

export const API_BASE_URL = `${API_SERVER_HOST}/api/v1`
export const PT_API_BASE_URL = `${PT_API_SERVER_HOST}/api/v1`
export const INDEXER_API_BASE_URL = `${INDEXER_API_SERVER_HOST}/api/v1`

export const VALID_BOOST_MESSAGE_TYPES = [
  "USER_PREMIUM_GUILD_SUBSCRIPTION",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3",
]

export const HOMEPAGE_URL = "http://getmochi.co"
export const TWITTER_URL = "https://twitter.com/getmochi_bot"
export const DISCORD_URL = "https://discord.gg/XQR36DQQGh"

export const EMOJI_REGEX = /^<:(.+|_):(\d+)>$/i
export const ANIMATED_EMOJI_REGEX = /^<a:(.+|_):(\d+)>$/i
export const USER_REGEX = /^<@(\d+)>$/i
export const CHANNEL_REGEX = /^<#(\d+)>$/i
export const ROLE_REGEX = /^<@&(\d+)>$/i

export const TWITTER_PROFILE_REGEX =
  /(https:\/\/twitter.com\/(?![a-zA-Z0-9_]+\/)([a-zA-Z0-9_]+))/g

const USAGE_STATS_URL = API_BASE_URL + "/data/usage-stats/gitbook?url="
export const DEPOSIT_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/deposit-and-withdraw"
export const BALANCE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/check-balance" +
  "&command=balance"
export const TICKER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/crypto-ticker" +
  "&command=ticker"
export const TIP_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/tip-bot" +
  "&command=tip"
export const AIRDROP_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/airdrop-token" +
  "&command=airdrop"
export const DEFAULT_TOKEN_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/set-default-token" +
  "&command=ticker"
export const RARITY_CHECKER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume/rarity-checker" +
  "&command=nft"
export const ADD_COLLECTION_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume/add-collection" +
  "&command=nft&action=add"
export const NFT_TICKER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume/nft-ticker" +
  "&command=nft&action=ticker"
export const SALE_TRACKER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume/sales-tracker" +
  "&command=sales"
export const DEFAULT_COLLECTION_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume/set-default-collection" +
  "&command=nft"
export const DEFAULT_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/default-roles" +
  "&command=defaultrole"
export const NFT_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/nft-role" +
  "&command=nftrole"
export const TOKEN_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/token-role" +
  "&command=tokenrole"
export const XP_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/xp-roles" +
  "&command=xprole"
export const MIX_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/mix-role" +
  "&command=mixrole"
export const GM_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/gm-gn" +
  "&command=gm"
export const NFT_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/nft-rarity-ranking-and-volume" +
  "&command=nft"
export const HELP_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/list-of-commands"
export const TOKEN_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/supported-tokens" +
  "&command=token"
export const WATCHLIST_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/token-watchlist" +
  "&command=watchlist"
export const REACTION_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/reaction-roles" +
  "&command=reactionrole"
export const LEVEL_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/level-roles" +
  "&command=levelrole"
export const LOG_CHANNEL_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/log-channels" +
  "&command=log"
export const TWITTER_WATCH_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/twitter-tweet-watcher-poe" +
  "&command=poetwitter"
export const VERIFY_WALLET_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/getting-started/wallet" +
  "&command=verify"
export const PROFILE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/users-profiles" +
  "&command=profile"
export const TELEGRAM_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/config-to-telegram-account" +
  "&command=telegram"
export const VOTE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/vote-for-mochi" +
  "&command=vote"
export const STARBOARD_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/starboard" +
  "&command=starboard"
export const PRUNE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/prune-inactive-users" +
  "&command=prune"
export const WELCOME_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/welcome-message" +
  "&command=welcome"
export const FEEDBACK_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/feedback-for-our-mochi" +
  "&command=feedback"
export const QUEST_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/user-engagement/daily-quest" +
  "&command=quest"
export const DAO_VOTING_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/dao-voting" +
  "&command=daovoting"
export const SENDXP_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/send-xp-to-member" +
  "&command=sendxp"
export const JOIN_LEAVE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/member-management" +
  "&command=joinleave"
export const LEVELUP_MESSAGE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/leveled-up-message" +
  "&command=levelupmessage"
export const WALLET_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/onchain-wallet" +
  "&command=wallet"
export const TOP_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/user-engagement/users-xp#show-top-users-with-the-highest-xp" +
  "&command=top"
export const MONIKER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/monikers" +
  "&command=monikers"
export const STATEMENT_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/transaction-statements" +
  "&command=statement"

export const FTMSCAN_API = "https://api.ftmscan.com/api"
export const BSCSCAN_API = "https://api.bscscan.com/api"
export const ETHSCAN_API = "https://api.etherscan.io/api"
export const POLYGONSCAN_API = "https://api.polygonscan.com/api"
