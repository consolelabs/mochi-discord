/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type BigFloat = object;

export interface DiscordgoUser {
  /** User's banner color, encoded as an integer representation of hexadecimal color code */
  accent_color?: number;

  /**
   * The hash of the user's avatar. Use Session.UserAvatar
   * to retrieve the avatar itself.
   */
  avatar?: string;

  /** The hash of the user's banner image. */
  banner?: string;

  /** Whether the user is a bot. */
  bot?: boolean;

  /** The discriminator of the user (4 numbers after name). */
  discriminator?: string;

  /**
   * The email of the user. This is only present when
   * the application possesses the email scope for the user.
   */
  email?: string;

  /**
   * The flags on a user's account.
   * Only available when the request is authorized via a Bearer token.
   */
  flags?: number;

  /** The ID of the user. */
  id?: string;

  /** The user's chosen language option. */
  locale?: string;

  /** Whether the user has multi-factor authentication enabled. */
  mfa_enabled?: boolean;

  /**
   * The type of Nitro subscription on a user's account.
   * Only available when the request is authorized via a Bearer token.
   */
  premium_type?: number;

  /**
   * The public flags on a user's account.
   * This is a combination of bit masks; the presence of a certain flag can
   * be checked by performing a bitwise AND between this int and the flag.
   */
  public_flags?: number;

  /** Whether the user is an Official Discord System user (part of the urgent message system). */
  system?: boolean;

  /**
   * The token of the user. This is only present for
   * the user represented by the current session.
   */
  token?: string;

  /** The user's username. */
  username?: string;

  /** Whether the user's email is verified. */
  verified?: boolean;
}

export interface EntitiesDiscordGuild {
  bot_addable?: boolean;
  bot_arrived?: boolean;
  features?: string[];
  icon?: string;
  id?: string;
  name?: string;
  owner?: boolean;

  /** @example 0 */
  permissions?: string;
}

export interface EntitiesListMyGuildsResponse {
  data?: EntitiesDiscordGuild[];
}

export interface EntitiesLoginResponse {
  access_token?: string;
  expires_at?: number;
}

export interface ModelActivity {
  guild_default?: boolean;
  id?: number;
  name?: string;
  xp?: number;
}

export interface ModelChain {
  coin_gecko_id?: string;
  currency?: string;
  id?: number;
  name?: string;
  short_name?: string;
}

export interface ModelCoingeckoSupportedTokens {
  id?: string;
  name?: string;
  symbol?: string;
}

export interface ModelConfigXpLevel {
  level?: number;
  min_xp?: number;
}

export interface ModelDiscordGuild {
  alias?: string;
  bot_scopes?: string[];
  created_at?: string;
  global_xp?: boolean;
  id?: string;
  log_channel?: string;
  name?: string;
  roles?: ModelGuildRole[];
}

export interface ModelDiscordGuildStat {
  created_at?: string;
  guild_id?: string;
  id?: string;
  nr_of_animated_emojis?: number;
  nr_of_announcement_channels?: number;
  nr_of_bots?: number;
  nr_of_categories?: number;
  nr_of_channels?: number;
  nr_of_custom_stickers?: number;
  nr_of_emojis?: number;
  nr_of_members?: number;
  nr_of_roles?: number;
  nr_of_server_stickers?: number;
  nr_of_stage_channels?: number;
  nr_of_static_emojis?: number;
  nr_of_stickers?: number;
  nr_of_text_channels?: number;
  nr_of_users?: number;
  nr_of_voice_channels?: number;
}

export interface ModelDiscordUserGMStreak {
  created_at?: string;
  discord_id?: string;
  guild_id?: string;
  last_streak_date?: string;
  streak_count?: number;
  total_count?: number;
  updated_at?: string;
}

export interface ModelDiscordUserUpvoteStreak {
  created_at?: string;
  discord_id?: string;
  last_streak_date?: string;
  streak_count?: number;
  total_count?: number;
  updated_at?: string;
}

export interface ModelGuildConfigActivity {
  active?: boolean;
  activity?: ModelActivity;
  activity_id?: number;
  guild_id?: string;
}

export interface ModelGuildConfigDefaultTicker {
  default_ticker?: string;
  guild_id?: string;
  query?: string;
}

export interface ModelGuildConfigGmGn {
  channel_id?: string;
  guild_id?: string;
  id?: string;
}

export interface ModelGuildConfigInviteTracker {
  guild_id?: string;
  id?: string;
  user_id?: string;
  webhook_url?: ModelJSONNullString;
}

export interface ModelGuildConfigLevelRole {
  guild_id?: string;
  level?: number;
  level_config?: ModelConfigXpLevel;
  role_id?: string;
}

export interface ModelGuildConfigRepostReaction {
  emoji?: string;
  guild_id?: string;
  id?: string;
  quantity?: number;
  repost_channel_id?: string;
}

export interface ModelGuildConfigSalesTracker {
  channel_id?: string;
  guild_id?: string;
  id?: string;
}

export interface ModelGuildConfigTwitterFeed {
  guild_id?: string;
  twitter_access_token?: string;
  twitter_access_token_secret?: string;
  twitter_consumer_key?: string;
  twitter_consumer_secret?: string;
}

export interface ModelGuildConfigVoteChannel {
  channel_id?: string;
  guild_id?: string;
  id?: string;
}

export interface ModelGuildConfigWalletVerificationMessage {
  content?: string;
  created_at?: string;
  discord_message_id?: string;
  embedded_message?: number[];
  guild_id?: string;
  verify_channel_id?: string;
  verify_role_id?: string;
}

export interface ModelGuildConfigWelcomeChannel {
  channel_id?: string;
  guild_id?: string;
  id?: string;
  welcome_message?: string;
}

export interface ModelGuildCustomCommand {
  actions?: number[];
  channels_permissions?: number[];
  cooldown?: number;
  cooldown_duration?: number;
  description?: string;
  enabled?: boolean;
  guild_id?: string;
  id?: string;
  roles_permissions?: number[];
}

export interface ModelGuildRole {
  guild_id?: string;
  name?: string;
  role_id?: number;
}

export interface ModelJSONNullString {
  string?: string;

  /** Valid is true if String is not NULL */
  valid?: boolean;
}

export interface ModelNFTCollection {
  address?: string;
  author?: string;
  chain_id?: string;
  created_at?: string;
  erc_format?: string;
  id?: string;
  image?: string;
  is_verified?: boolean;
  name?: string;
  symbol?: string;
}

export interface ModelNFTCollectionDetail {
  address?: string;
  author?: string;
  chain?: ModelChain;
  chain_id?: string;
  created_at?: string;
  erc_format?: string;
  id?: string;
  image?: string;
  is_verified?: boolean;
  name?: string;
  symbol?: string;
}

export interface ModelNewListedNFTCollection {
  address?: string;
  author?: string;
  chain?: string;
  chain_id?: string;
  created_at?: string;
  erc_format?: string;
  id?: string;
  image?: string;
  is_verified?: boolean;
  name?: string;
  symbol?: string;
}

export interface ModelToken {
  address?: string;
  chain?: ModelChain;
  chain_id?: number;
  coin_gecko_id?: string;
  decimal?: number;
  discord_bot_supported?: boolean;
  guild_default?: boolean;
  id?: number;
  is_native?: boolean;
  name?: string;
  symbol?: string;
}

export interface ModelUpvoteStreakTier {
  id?: number;
  streak_required?: number;
  vote_interval?: number;
  xp_per_interval?: number;
}

export interface ModelUserFactionXpsMapping {
  academy_xp?: number;
  imperial_xp?: number;
  merchant_xp?: number;
  rebellio_xp?: number;
}

export interface ModelUserTelegramDiscordAssociation {
  discord_id?: string;
  telegram_username?: string;
}

export interface ModelUserWallet {
  address?: string;
  chain_type?: ModelJSONNullString;
  created_at?: string;
  guild_id?: string;
  user_discord_id?: string;
}

export interface ModelWhitelistCampaign {
  created_at?: string;
  guild_id?: string;
  name?: string;
  role_id?: number;
}

export interface ModelWhitelistCampaignUser {
  address?: string;
  created_at?: string;
  discord_id?: string;
  notes?: string;
  whitelist_campaign_id?: string;
}

export interface RequestAddToWatchlistRequest {
  coin_gecko_id?: string;
  symbol?: string;
  user_id?: string;
}

export interface RequestAddWhitelistCampaignUser {
  address?: string;
  discord_id?: string;
  notes?: string;
  whitelist_campaign_id?: string;
}

export interface RequestAddWhitelistCampaignUserRequest {
  users?: RequestAddWhitelistCampaignUser[];
}

export interface RequestConfigDefaultCollection {
  address?: string;
  chain?: string;
  guild_id?: string;
  symbol?: string;
}

export interface RequestConfigDefaultTokenRequest {
  guild_id?: string;
  symbol?: string;
}

export interface RequestConfigGroupNFTRoleRequest {
  collection_address?: string[];
  group_name?: string;
  guild_id?: string;
  number_of_tokens?: number;
  role_id?: string;
}

export interface RequestConfigLevelRoleRequest {
  guild_id?: string;
  level?: number;
  role_id?: string;
}

export interface RequestConfigRepostRequest {
  emoji?: string;
  guild_id?: string;
  quantity?: number;
  repost_channel_id?: string;
}

export interface RequestConfigureInviteRequest {
  guild_id?: string;
  log_channel?: string;
  webhook_url?: string;
}

export interface RequestCreateDefaultRoleRequest {
  guild_id?: string;
  role_id?: string;
}

export interface RequestCreateGuildRequest {
  id?: string;
  name?: string;
}

export interface RequestCreateNFTCollectionRequest {
  address?: string;
  author?: string;
  chain?: string;
  chain_id?: string;
  guild_id?: string;
}

export interface RequestCreateUserRequest {
  guild_id?: string;
  id?: string;
  invited_by?: string;
  nickname?: string;
  username?: string;
}

export interface RequestCreateWhitelistCampaignRequest {
  guild_id?: string;
  name?: string;
}

export interface RequestDeleteVoteChannelConfigRequest {
  guild_id?: string;
}

export interface RequestDeleteWelcomeConfigRequest {
  guild_id?: string;
}

export interface RequestEditMessageRepostRequest {
  guild_id?: string;
  origin_channel_id?: string;
  origin_message_id?: string;
  repost_channel_id?: string;
  repost_message_id?: string;
}

export interface RequestGenerateVerificationRequest {
  guild_id?: string;
  is_reverify?: boolean;
  user_discord_id?: string;
}

export interface RequestGiftXPRequest {
  admin_discord_id?: string;
  channel_id?: string;
  guild_id?: string;
  user_discord_id?: string;
  xp_amount?: number;
}

export interface RequestGuildConfigDefaultTickerRequest {
  default_ticker?: string;
  guild_id?: string;
  query?: string;
}

export interface RequestLinkUserTelegramWithDiscordRequest {
  discord_id?: string;
  telegram_username?: string;
}

export interface RequestLoginRequest {
  access_token?: string;
}

export interface RequestNewGuildConfigWalletVerificationMessageRequest {
  content?: string;
  created_at?: string;
  discord_message_id?: string;
  embedded_message?: number[];
  guild_id?: string;
  verify_channel_id?: string;
  verify_role_id?: string;
}

export interface RequestRoleReactionRequest {
  guild_id?: string;
  message_id?: string;
  reaction?: string;
}

export interface RequestRoleReactionUpdateRequest {
  guild_id?: string;
  message_id?: string;
  reaction?: string;
  role_id?: string;
}

export interface RequestSetUpvoteMessageCacheRequest {
  channel_id?: string;
  guild_id?: string;
  message_id?: string;
  user_id?: string;
}

export interface RequestTransferRequest {
  all?: boolean;
  amount?: number;
  channelId?: string;
  cryptocurrency?: string;
  each?: boolean;
  guildId?: string;
  recipients?: string[];
  sender?: string;
  transferType?: string;
}

export interface RequestTwitterHashtag {
  channel_id?: string;
  from_twitter?: string[];
  guild_id?: string;
  hashtag?: string[];
  rule_id?: string;
  twitter_username?: string[];
  user_id?: string;
}

export interface RequestTwitterPost {
  guild_id?: string;
  tweet_id?: string;
  twitter_handle?: string;
  twitter_id?: string;
}

export interface RequestUpdateGuildRequest {
  global_xp?: string;
  log_channel?: string;
}

export interface RequestUpsertCustomTokenConfigRequest {
  active?: boolean;
  address?: string;
  chain?: string;
  chain_id?: number;
  coin_gecko_id?: string;
  decimals?: number;
  discord_bot_supported?: boolean;
  guild_default?: boolean;
  guild_id?: string;
  id?: number;
  name?: string;
  symbol?: string;
}

export interface RequestUpsertGmConfigRequest {
  channel_id?: string;
  guild_id?: string;
}

export interface RequestUpsertGuildPruneExcludeRequest {
  guild_id?: string;
  role_id?: string;
}

export interface RequestUpsertGuildTokenConfigRequest {
  active?: boolean;
  guild_id?: string;
  symbol?: string;
}

export interface RequestUpsertVoteChannelConfigRequest {
  channel_id?: string;
  guild_id?: string;
}

export interface RequestUpsertWelcomeConfigRequest {
  channel_id?: string;
  guild_id?: string;
  welcome_message?: string;
}

export interface RequestVerifyWalletAddressRequest {
  code?: string;
  signature?: string;
  wallet_address?: string;
}

export interface ResponseAddToWatchlistResponse {
  data?: ResponseAddToWatchlistResponseData;
}

export interface ResponseAddToWatchlistResponseData {
  base_suggestions?: ModelCoingeckoSupportedTokens[];
  target_suggestions?: ModelCoingeckoSupportedTokens[];
}

export interface ResponseCoinImage {
  large?: string;
  small?: string;
  thumb?: string;
}

export interface ResponseCoinMarketItemData {
  current_price?: number;
  id?: string;
  image?: string;
  is_pair?: boolean;
  name?: string;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price?: number[] };
  symbol?: string;
}

export interface ResponseCoinPriceHistoryResponse {
  from?: string;
  prices?: number[];
  times?: string[];
  timestamps?: number[];
  to?: string;
}

export interface ResponseCollectionSuggestions {
  address?: string;
  chain?: string;
  name?: string;
  symbol?: string;
}

export interface ResponseCompareTokenReponseData {
  base_coin?: ResponseGetCoinResponse;
  base_coin_suggestions?: ModelCoingeckoSupportedTokens[];
  from?: string;
  ratios?: number[];
  target_coin?: ResponseGetCoinResponse;
  target_coin_suggestions?: ModelCoingeckoSupportedTokens[];
  times?: string[];
  to?: string;
}

export interface ResponseCompareTokenResponse {
  data?: ResponseCompareTokenReponseData;
}

export interface ResponseConfigGroupNFTRoleResponse {
  group_name?: string;
  guild_id?: string;
  nft_collection_configs?: ResponseNFTCollectionConfig[];
  number_of_tokens?: number;
  role_id?: string;
}

export interface ResponseConfigureInvitesResponse {
  data?: string;
}

export interface ResponseCreateCustomCommandResponse {
  data?: ModelGuildCustomCommand;
}

export interface ResponseCreateNFTCollectionResponse {
  data?: ModelNFTCollection;
}

export interface ResponseCurrentUserUpvoteStreakResponse {
  data?: ResponseGetUserCurrentUpvoteStreakResponse;
}

export interface ResponseDataFilterConfigByReaction {
  data?: ResponseRoleReactionResponse;
}

export interface ResponseDataListRoleReactionResponse {
  data?: ResponseListRoleReactionResponse;
}

export interface ResponseDefaultRole {
  guild_id?: string;
  role_id?: string;
}

export interface ResponseDefaultRoleResponse {
  data?: ResponseDefaultRole;
  ok?: boolean;
}

export interface ResponseGenerateVerificationResponse {
  code?: string;
  status?: string;
}

export interface ResponseGetAllNFTSalesTrackerResponse {
  data?: ResponseNFTSalesTrackerResponse[];
}

export interface ResponseGetAllTwitterConfigResponse {
  data?: ModelGuildConfigTwitterFeed[];
  message?: string;
}

export interface ResponseGetAllTwitterHashtagConfigResponse {
  data?: ResponseTwitterHashtag[];
}

export interface ResponseGetCoinResponse {
  asset_platform_id?: string;
  id?: string;
  image?: ResponseCoinImage;
  market_cap_rank?: number;
  market_data?: ResponseMarketData;
  name?: string;
  symbol?: string;
  tickers?: ResponseTickerData[];
}

export interface ResponseGetCoinResponseWrapper {
  data?: ResponseGetCoinResponse;
}

export interface ResponseGetCollectionCountResponse {
  data?: ResponseNFTCollectionCount;
}

export interface ResponseGetCustomCommandResponse {
  data?: ModelGuildCustomCommand;
}

export interface ResponseGetDataUserProfileResponse {
  data?: ResponseGetUserProfileResponse;
}

export interface ResponseGetDefaultTokenResponse {
  data?: ModelToken;
}

export interface ResponseGetDetailNftCollectionResponse {
  data?: ModelNFTCollectionDetail;
}

export interface ResponseGetGmConfigResponse {
  data?: ModelGuildConfigGmGn;
  message?: string;
}

export interface ResponseGetGuildDefaultTickerResponse {
  data?: ModelGuildConfigDefaultTicker;
}

export interface ResponseGetGuildPruneExcludeResponse {
  data?: ResponseGuildPruneExcludeList;
  message?: string;
}

export interface ResponseGetGuildResponse {
  alias?: string;
  bot_scopes?: string[];
  global_xp?: boolean;
  id?: string;
  log_channel?: string;
  log_channel_id?: string;
  name?: string;
}

export interface ResponseGetGuildTokensResponse {
  data?: ModelToken[];
}

export interface ResponseGetGuildUserResponse {
  guild_id?: string;
  invited_by?: string;
  nickname?: string;
  user_id?: string;
}

export interface ResponseGetGuildsResponse {
  data?: ResponseGetGuildResponse[];
}

export interface ResponseGetHistoricalMarketChartResponse {
  data?: ResponseCoinPriceHistoryResponse;
}

export interface ResponseGetInviteTrackerConfigResponse {
  data?: ModelGuildConfigInviteTracker;
  message?: string;
}

export interface ResponseGetInvitesLeaderboardResponse {
  data?: ResponseUserInvitesAggregation[];
}

export interface ResponseGetInvitesResponse {
  data?: string[];
}

export interface ResponseGetLevelRoleConfigsResponse {
  data?: ModelGuildConfigLevelRole[];
}

export interface ResponseGetLinkedTelegramResponse {
  data?: ModelUserTelegramDiscordAssociation;
}

export interface ResponseGetListAllChainsResponse {
  data?: ModelChain[];
}

export interface ResponseGetMyInfoResponse {
  data?: DiscordgoUser;
}

export interface ResponseGetNFTCollectionByAddressChainResponse {
  data?: ModelNFTCollection;
}

export interface ResponseGetRepostReactionConfigsResponse {
  data?: ModelGuildConfigRepostReaction[];
}

export interface ResponseGetSalesTrackerConfigResponse {
  data?: ModelGuildConfigSalesTracker;
  message?: string;
}

export interface ResponseGetSupportedChains {
  data?: string[];
}

export interface ResponseGetSupportedTokensResponse {
  data?: ModelToken[];
}

export interface ResponseGetTwitterHashtagConfigResponse {
  data?: ResponseTwitterHashtag;
}

export interface ResponseGetUpvoteTiersConfig {
  data?: ModelUpvoteStreakTier[];
  message?: string;
}

export interface ResponseGetUserCurrentGMStreakResponse {
  data?: ModelDiscordUserGMStreak;
}

export interface ResponseGetUserCurrentUpvoteStreakResponse {
  discord_id?: string;
  last_streak_time?: string;
  minutes_until_reset?: number;
  minutes_until_reset_discordbotlist?: number;
  minutes_until_reset_topgg?: number;
  streak_count?: number;
  total_count?: number;
}

export interface ResponseGetUserProfileResponse {
  about_me?: string;
  current_level?: ModelConfigXpLevel;
  guild?: ModelDiscordGuild;
  guild_rank?: number;
  guild_xp?: number;
  id?: string;
  next_level?: ModelConfigXpLevel;
  nr_of_actions?: number;
  progress?: number;
  user_faction_xps?: ModelUserFactionXpsMapping;
  user_wallet?: ModelUserWallet;
}

export interface ResponseGetUserResponse {
  data?: ResponseUser;
}

export interface ResponseGetUserUpvoteLeaderboardResponse {
  data?: ModelDiscordUserUpvoteStreak[];
  message?: string;
}

export interface ResponseGetVoteChannelConfigResponse {
  data?: ModelGuildConfigVoteChannel;
  message?: string;
}

export interface ResponseGetWatchlistResponse {
  /** Pagination *PaginationResponse  `json:"pagination"` */
  data?: ResponseCoinMarketItemData[];
}

export interface ResponseGetWelcomeChannelConfigResponse {
  data?: ModelGuildConfigWelcomeChannel;
  message?: string;
}

export interface ResponseGiftXpHandlerResponse {
  data?: ResponseHandleUserActivityResponse;
}

export interface ResponseGuildPruneExcludeList {
  guild_id?: string;
  roles?: string[];
}

export interface ResponseHandleUserActivityResponse {
  action?: string;
  added_xp?: number;
  channel_id?: string;
  current_level?: number;
  current_xp?: number;
  guild_id?: string;
  level_up?: boolean;
  timestamp?: string;
  user_id?: string;
}

export interface ResponseInDiscordWalletBalancesResponse {
  data?: ResponseUserBalancesResponse;
  status?: string;
}

export interface ResponseInDiscordWalletTransferResponse {
  amount?: number;
  cryptocurrency?: string;
  fromDiscordID?: string;
  toDiscordID?: string;
  transactionFee?: number;
  txHash?: string;
  txUrl?: string;
}

export interface ResponseInDiscordWalletTransferResponseWrapper {
  data?: ResponseInDiscordWalletTransferResponse[];
  errors?: string[];
}

export interface ResponseInDiscordWalletWithdrawResponse {
  amount?: number;
  cryptocurrency?: string;
  fromDiscordId?: string;
  toAddress?: string;
  transactionFee?: number;
  txHash?: string;
  txURL?: string;
  withdrawalAmount?: BigFloat;
}

export interface ResponseIndexerChain {
  chain_id?: number;
  is_evm?: boolean;
  name?: string;
  symbol?: string;
}

export interface ResponseIndexerGetNFTTokenDetailResponseWithSuggestions {
  data?: ResponseIndexerNFTTokenDetailData;
  default_symbol?: ResponseCollectionSuggestions;
  suggestions?: ResponseCollectionSuggestions[];
}

export interface ResponseIndexerGetNFTTokenTxHistoryResponse {
  data?: ResponseIndexerGetNftTokenTxHistory[];
}

export interface ResponseIndexerGetNFTTokensResponse {
  data?: ResponseIndexerNFTTokenDetailData[];
  page?: number;
  size?: number;
  total?: number;
}

export interface ResponseIndexerGetNftTokenTxHistory {
  contract_address?: string;
  created_time?: string;
  event_type?: string;
  from?: string;
  listing_status?: string;
  to?: string;
  token_id?: string;
  transaction_hash?: string;
}

export interface ResponseIndexerNFTCollectionTickersData {
  address?: string;
  chain?: ResponseIndexerChain;
  collection_image?: string;
  floor_price?: ResponseIndexerPrice;
  items?: number;
  last_sale_price?: ResponseIndexerPrice;
  marketplaces?: string[];
  name?: string;
  owners?: number;
  tickers?: ResponseIndexerTickers;
  total_volume?: ResponseIndexerPrice;
}

export interface ResponseIndexerNFTCollectionTickersResponse {
  data?: ResponseIndexerNFTCollectionTickersData;
}

export interface ResponseIndexerNFTTokenAttribute {
  collection_address?: string;
  count?: number;
  frequency?: string;
  rarity?: string;
  token_id?: string;
  trait_type?: string;
  value?: string;
}

export interface ResponseIndexerNFTTokenDetailData {
  amount?: string;
  attributes?: ResponseIndexerNFTTokenAttribute[];
  collection_address?: string;
  description?: string;
  image?: string;
  image_cdn?: string;
  image_content_type?: string;
  marketplace?: ResponseNftListingMarketplace[];
  metadata_id?: string;
  name?: string;
  owner?: ResponseIndexerNftTokenOwner;
  rarity?: ResponseIndexerNFTTokenRarity;
  rarity_rank?: number;
  rarity_score?: string;
  rarity_tier?: string;
  thumbnail_cdn?: string;
  token_id?: string;
}

export interface ResponseIndexerNFTTokenRarity {
  rank?: number;
  rarity?: string;
  score?: string;
  total?: number;
}

export interface ResponseIndexerNftTokenOwner {
  collection_address?: string;
  owner_address?: string;
  token_id?: string;
}

export interface ResponseIndexerPrice {
  amount?: string;
  token?: ResponseIndexerToken;
}

export interface ResponseIndexerTickers {
  prices?: ResponseIndexerPrice[];
  times?: string[];
  timestamps?: number[];
}

export interface ResponseIndexerToken {
  address?: string;
  decimals?: number;
  is_native?: boolean;
  symbol?: string;
}

export interface ResponseInvitesAggregationResponse {
  data?: ResponseUserInvitesAggregation;
}

export interface ResponseLinkUserTelegramWithDiscordResponse {
  data?: ResponseLinkUserTelegramWithDiscordResponseData;
}

export interface ResponseLinkUserTelegramWithDiscordResponseData {
  discord_id?: string;
  discord_username?: string;
  telegram_username?: string;
}

export interface ResponseListAllCustomTokenResponse {
  data?: ModelToken[];
}

export interface ResponseListAllNFTCollectionsResponse {
  data?: ModelNFTCollection[];
}

export interface ResponseListCustomCommandsResponse {
  data?: ModelGuildCustomCommand[];
}

export interface ResponseListGuildGroupNFTRolesResponse {
  data?: ResponseListGuildNFTRoleConfigsResponse[];
}

export interface ResponseListGuildNFTRoleConfigsResponse {
  color?: number;
  group_name?: string;
  guild_id?: string;
  id?: string;
  nft_collection_configs?: ResponseNFTCollectionConfig[];
  number_of_tokens?: number;
  role_id?: string;
  role_name?: string;
}

export interface ResponseListRoleReactionResponse {
  configs?: ResponseRoleReactionByMessage[];
  guild_id?: string;
  success?: boolean;
}

export interface ResponseLogoutResponse {
  message?: string;
  status?: string;
}

export interface ResponseMarketData {
  current_price?: Record<string, number>;
  market_cap?: Record<string, number>;
  price_change_percentage_1h_in_currency?: Record<string, number>;
  price_change_percentage_24h_in_currency?: Record<string, number>;
  price_change_percentage_7d_in_currency?: Record<string, number>;
}

export interface ResponseNFTCollectionConfig {
  address?: string;
  author?: string;
  chain_id?: string;
  chain_name?: string;
  collection_id?: string;
  created_at?: string;
  erc_format?: string;
  explorer_url?: string;
  id?: string;
  image?: string;
  is_verified?: boolean;
  name?: string;
  symbol?: string;
}

export interface ResponseNFTCollectionCount {
  eth_collection?: number;
  ftm_collection?: number;
  op_collection?: number;
  total?: number;
}

export interface ResponseNFTCollectionsData {
  data?: ModelNFTCollection[];
  metadata?: UtilPagination;
}

export interface ResponseNFTCollectionsResponse {
  data?: ResponseNFTCollectionsData;
}

export interface ResponseNFTNewListedResponse {
  data?: ModelNewListedNFTCollection[];
  page?: number;
  size?: number;
  total?: number;
}

export interface ResponseNFTSalesTrackerResponse {
  channel_id?: string;
  contract_address?: string;
  guild_id?: string;
  platform?: string;
}

export interface ResponseNFTTradingVolume {
  collection_address?: string;
  collection_chain_id?: number;
  collection_name?: string;
  collection_symbol?: string;
  token?: string;
  trading_volume?: number;
}

export interface ResponseNFTTradingVolumeResponse {
  data?: ResponseNFTTradingVolume[];
}

export interface ResponseNewGuildConfigWalletVerificationMessageResponse {
  data?: ModelGuildConfigWalletVerificationMessage;
  status?: string;
}

export interface ResponseNewGuildGroupNFTRoleResponse {
  data?: ResponseConfigGroupNFTRoleResponse;
  message?: string;
}

export interface ResponseNftListingMarketplace {
  contract_address?: string;
  item_url?: string;
  platform_id?: number;
  platform_name?: string;
  token_id?: string;
}

export interface ResponseNftMetadataAttrIcon {
  discord_icon?: string;
  id?: number;
  trait_type?: string;
  unicode_icon?: string;
}

export interface ResponseNftMetadataAttrIconResponse {
  data?: ResponseNftMetadataAttrIcon[];
}

export interface ResponseNftSales {
  buyer?: string;
  nft_collection_address?: string;
  nft_name?: string;
  nft_price?: number;
  nft_price_token?: string;
  nft_status?: string;
  platform?: string;
  seller?: string;
}

export interface ResponseNftSalesResponse {
  data?: ResponseNftSales[];
}

export interface ResponseResponseMessage {
  message?: string;
}

export interface ResponseResponseStatus {
  status?: string;
}

export interface ResponseResponseSucess {
  success?: boolean;
}

export interface ResponseRole {
  id?: string;
  reaction?: string;
}

export interface ResponseRoleReactionByMessage {
  message_id?: string;
  roles?: ResponseRole[];
}

export interface ResponseRoleReactionConfigResponse {
  guild_id?: string;
  message_id?: string;
  roles?: ResponseRole[];
  success?: boolean;
}

export interface ResponseRoleReactionResponse {
  guild_id?: string;
  message_id?: string;
  role?: ResponseRole;
}

export interface ResponseSearchCoinResponse {
  data?: ModelCoingeckoSupportedTokens[];
}

export interface ResponseTickerData {
  base?: string;
  coin_id?: string;
  last?: number;
  target?: string;
  target_coin_id?: string;
}

export interface ResponseToggleActivityConfigResponse {
  data?: ModelGuildConfigActivity;
  message?: string;
}

export interface ResponseTwitterHashtag {
  channel_id?: string;
  created_at?: string;
  from_twitter?: string[];
  guild_id?: string;
  hashtag?: string[];
  rule_id?: string;
  twitter_username?: string[];
  updated_at?: string;
  user_id?: string;
}

export interface ResponseUpdateCustomCommandResponse {
  data?: ModelGuildCustomCommand;
}

export interface ResponseUser {
  guild_users?: ResponseGetGuildUserResponse[];
  id?: string;
  in_discord_wallet_address?: string;
  in_discord_wallet_number?: number;
  nr_of_join?: number;
  username?: string;
}

export interface ResponseUserBalancesResponse {
  balances?: Record<string, number>;
  balances_in_usd?: Record<string, number>;
}

export interface ResponseUserInvitesAggregation {
  fake?: number;
  inviter_id?: string;
  left?: number;
  regular?: number;
}

export interface UtilPagination {
  page?: number;
  size?: number;
  total?: number;
}
