import {
  API_SERVER_HOST,
  PT_API_SERVER_HOST,
  INDEXER_API_SERVER_HOST,
  APPLICATION_ID,
  MOCHI_PROFILE_API_SERVER_HOST,
  MOCHI_PAY_API_SERVER_HOST,
  MOCHI_TELEGRAM_API_SERVER_HOST,
  GAME_STORE_API_SERVER_HOST,
  ECOCAL_API_SERVER_HOST,
  MOCHI_GUESS_API_HOST,
  PREVIEW,
  PROD,
  MOCHI_PROFILE_API_SERVER_HOST_PUBLIC,
} from "env"

export const DOT = "•"
export const COMMA = ","
export const SPACE = " "
export const SPACES_REGEX = / +/g
export const EMPTY = ""
export const VERTICAL_BAR = "｜"
export const APPROX = "≈"
export const DASH = "-"
export const HORIZONTAL_BAR = "⎯"

export const PREFIX = "$"
export const SLASH_PREFIX = "/"
export const HELP = "help"
export const HELP_CMD = `${PREFIX}${HELP}`

export const PROFILE_THUMBNAIL =
  "https://cdn.discordapp.com/emojis/916737804384485447.png?size=240"

export const DEFI_DEFAULT_FOOTER = `Use ${PREFIX}tokens for a list of supported tokens`

export const PRODUCT_NAME = `[Mochi Discord ${
  PREVIEW ? "beta" : PROD ? "prod" : "dev"
}]` as const

export const API_BASE_URL = `${API_SERVER_HOST}/api/v1`
export const PT_API_BASE_URL = `${PT_API_SERVER_HOST}/api/v1`
export const INDEXER_API_BASE_URL = `${INDEXER_API_SERVER_HOST}/api/v1`
export const MOCHI_PROFILE_API_BASE_URL = `${MOCHI_PROFILE_API_SERVER_HOST}/api/v1`
export const MOCHI_PROFILE_API_BASE_URL_PUBLIC = `${MOCHI_PROFILE_API_SERVER_HOST_PUBLIC}/api/v1`
export const MOCHI_PAY_API_BASE_URL = `${MOCHI_PAY_API_SERVER_HOST}/api/v1`
export const MOCHI_PAY_API_BASE_URL_V2 = `${MOCHI_PAY_API_SERVER_HOST}/api/v2`
export const MOCHI_TELEGRAM_API_BASE_URL = `${MOCHI_TELEGRAM_API_SERVER_HOST}/api/v1`
export const GAME_STORE_API_BASE_URL = `${GAME_STORE_API_SERVER_HOST}/api/v1`
export const KRYSTAL_API_BASE_URL = `https://api.krystal.app/all/v1`
export const ECOCAL_API_BASE_URL = `${ECOCAL_API_SERVER_HOST}/mochi`
export const CHOTOT_GATEWAY_URL = "https://gateway.chotot.com"
export const MOCHI_GUESS_API_BASE_URL = `${MOCHI_GUESS_API_HOST}/api/v1`

export const VALID_BOOST_MESSAGE_TYPES = [
  "USER_PREMIUM_GUILD_SUBSCRIPTION",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3",
]

// usd
export const MIN_DUST = 0.001

export const HOMEPAGE_URL = process.env.HOMEPAGE_URL || "https://mochi.gg"
export const MOCHI_DOC_URL = "https://docs.mochi.gg"
export const TWITTER_URL = "https://twitter.com/getmochi_bot"
export const DISCORD_URL = "https://discord.gg/XQR36DQQGh"

export const TELEGRAM_USER_URL = `https://t.me`
export const TWITTER_USER_URL = "https://twitter.com"
export const GITHUB_USER_URL = "https://github.com"

export const EMOJI_REGEX = /^<:(.+|_):(\d+)>$/i
export const ANIMATED_EMOJI_REGEX = /^<a:(.+|_):(\d+)>$/i
export const USER_REGEX = /^<@(\d+)>$/i
export const CHANNEL_REGEX = /^<#(\d+)>$/i
export const ROLE_REGEX = /^<@&(\d+)>$/i

export const TWITTER_PROFILE_REGEX =
  /(https:\/\/twitter.com\/(?![a-zA-Z0-9_]+\/)([a-zA-Z0-9_]+))/g
export const URL_REGEX =
  /[(http(s)?)://(www.)?a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi

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
export const TRENDING_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/trending" +
  "&command=trending"
export const GAINER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/gainer" +
  "&command=gainer"
export const LOSER_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/loser" +
  "&command=loser"
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
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/nft-roles" +
  "&command=nftrole"
export const TOKEN_ROLE_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/server-administration/token-roles" +
  "&command=tokenrole"
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
export const PRICE_ALERT_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/price-alert" +
  "&command=alert"
export const GAS_ESTIMATION_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/gas-fee-estimation" +
  "&command=gas"
export const PAY_LINK_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/pay-link" +
  "&command=pay&action=link"
export const PAY_ME_GITBOOK =
  USAGE_STATS_URL +
  "https://mochibot.gitbook.io/mochi-bot/functions/crypto-management/pay-me" +
  "&command=pay&action=me"

export const FTMSCAN_API = "https://api.ftmscan.com/api"
export const BSCSCAN_API = "https://api.bscscan.com/api"
export const ETHSCAN_API = "https://api.etherscan.io/api"
export const POLYGONSCAN_API = "https://api.polygonscan.com/api"

export const CHAIN_EXPLORER_BASE_URLS: Record<string, string> = {
  "0": "https://solscan.io",
  "1": "https://etherscan.io",
  "56": "https://bscscan.com",
  "137": "https://polygonscan.com",
  "250": "https://ftmscan.com",
  "9999": "https://aptoscan.com",
}

// Bot URL with 11 initial permissions
// 1. CREATE_INSTANT_INVITE
// 2. VIEW_CHANNEL
// 3. MODERATE_MEMBERS
// 4. SEND_MESSAGES
// 5. SEND_MESSAGES_IN_THREAD
// 6. EMBED_LINKS
// 7. ATTACH_FILES
// 8. MENTION_EVERYONE
// 9. USE_EXTERNAL_EMOJIS
// 10. USE_EXTERNAL_STICKERS
// 11. USE_APPLICATION_COMMANDS
export const DEFAULT_BOT_INVITE_URL = `https://discord.com/api/oauth2/authorize?client_id=${APPLICATION_ID}&permissions=1513976417281&scope=bot%20applications.commands`

export const MOCHI_SERVER_INVITE_URL = "https://discord.com/invite/3d2FdBG2My"

export const MOCHI_PROFILE_ACTIVITY_STATUS_NEW = "new"
export const MOCHI_PROFILE_ACTIVITY_STATUS_READ = "read"
export const MOCHI_APP_SERVICE = "Mochi App"
export const MOCHI_PAY_SERVICE = "Mochi Pay"
export const MOCHI_ACTION_TIP = "tip"
export const MOCHI_ACTION_WITHDRAW = "withdraw"
export const MOCHI_ACTION_DEPOSIT = "deposut"
export const MOCHI_ACTION_FEEDBACK = "feedback"
export const MOCHI_ACTION_PROFILE = "profile"
export const MOCHI_ACTION_REACTIONROLE = "reactionrole"
export const MOCHI_ACTION_LEVELROLE = "levelrole"
export const MOCHI_ACTION_DEFAULTROLE = "defaultrole"
export const MOCHI_ACTION_MIXROLE = "mixrole"
export const MOCHI_ACTION_XPROLE = "xprole"
export const MOCHI_ACTION_NFTROLE = "nftrole"
export const MOCHI_ACTION_TOKENROLE = "tokenrole"
export const MOCHI_ACTION_VERIFY = "verify"
export const MOCHI_ACTION_LOG = "log"
export const MOCHI_ACTION_PROPOSAL = "proposal"
export const MOCHI_ACTION_SALES = "sales"
export const MOCHI_ACTION_GM = "gm"
export const MOCHI_ACTION_STARBOARD = "starboard"
export const MOCHI_ACTION_LEVELUPMESSAGE = "levelupmessage"
export const MOCHI_ACTION_WELCOMEMESSAGE = "welcomemessage"
export const MOCHI_ACTION_TOKEN = "token"
export const MOCHI_ACTION_MONIKER = "moniker"
export const MOCHI_ACTION_WALLET = "wallet"
export const MOCHI_ACTION_TELEGRAM = "telegram"
export const MOCHI_ACTION_PAY_ME = "payme"
export const MOCHI_ACTION_PAY_LINK = "paylink"
export const MOCHI_PLATFORM_DISCORD = "discord"

export const TRACKING_TYPE_FOLLOW = "follow"
export const TRACKING_TYPE_TRACK = "track"
export const TRACKING_TYPE_COPY = "copy"

export const PREFIX_EMAIL_HANDLER = ["mail:", "email:", "gmail:"]
export const PREFIX_DISCORD_HANDLER = ["<@", "discord:", "dc:", "dsc:"]
export const PREFIX_TELEGRAM_HANDLER = [
  "telegram:",
  "tel:",
  "tg@",
  "tg:",
  "t.me/",
]
