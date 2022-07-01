import { API_SERVER_HOST } from "env"

export const DOT = "•"
export const COMMA = ","
export const SPACE = " "
export const EMPTY = ""
export const VERTICAL_BAR = "|"

export const PREFIX = "$"
export const HELP = "help"
export const HELP_CMD = `${PREFIX}${HELP}`

export const PROFILE_THUMBNAIL =
  "https://cdn.discordapp.com/emojis/916737804384485447.png?size=240"

export const DEFI_DEFAULT_FOOTER = `Use ${PREFIX}tokens for a list of supported tokens`

export const API_BASE_URL = `${API_SERVER_HOST}/api/v1`

export const VALID_BOOST_MESSAGE_TYPES = [
  "USER_PREMIUM_GUILD_SUBSCRIPTION",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2",
  "USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3",
]
