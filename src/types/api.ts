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

export interface ModelActivity {
  guild_default?: boolean;
  id?: number;
  name?: string;
  xp?: number;
}

export interface ModelAirdropCampaign {
  created_at?: string;
  deadline_at?: string;
  detail?: string;
  id?: number;
  prev_airdrop_campaign_id?: number;
  profile_campaign_status?: string;
  reward_amount?: number;
  reward_token_symbol?: string;
  status?: string;
  title?: string;
  updated_at?: string;
}

export interface ModelAirdropStatusCount {
  count?: number;
  status?: string;
}

export interface ModelChain {
  coin_gecko_id?: string;
  currency?: string;
  id?: number;
  name?: string;
  short_name?: string;
}

export interface ModelCoingeckoSupportedTokens {
  current_price?: number;
  detail_platforms?: number[];
  id?: string;
  is_native?: boolean;
  is_popular?: boolean;
  most_popular?: boolean;
  name?: string;
  symbol?: string;
}

export interface ModelConfigXpLevel {
  level?: number;
  min_xp?: number;
}

export interface ModelDiscordGuild {
  active?: boolean;
  alias?: string;
  bot_scopes?: string[];
  created_at?: string;
  global_xp?: boolean;
  id?: string;
  log_channel?: string;
  name?: string;
  roles?: ModelGuildRole[];
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

export interface ModelGuildConfigActivity {
  active?: boolean;
  activity?: ModelActivity;
  activity_id?: number;
  guild_id?: string;
}

export interface ModelGuildConfigAdminRole {
  guild_id?: string;
  id?: number;
  role_id?: string;
}

export interface ModelGuildConfigDefaultCollection {
  address?: string;
  chain_id?: string;
  created_at?: string;
  guild_id?: string;
  symbol?: string;
  updated_at?: string;
}

export interface ModelGuildConfigDefaultTicker {
  default_ticker?: string;
  guild_id?: string;
  query?: string;
}

export interface ModelGuildConfigGmGn {
  channel_id?: string;
  emoji?: string;
  guild_id?: string;
  id?: string;
  msg?: string;
  sticker?: string;
}

export interface ModelGuildConfigLevelRole {
  guild_id?: string;
  level?: number;
  level_config?: ModelConfigXpLevel;
  role_id?: string;
}

export interface ModelGuildConfigLevelupMessage {
  channel_id?: string;
  created_at?: string;
  guild_id?: string;
  id?: string;
  image_url?: string;
  message?: string;
  updated_at?: string;
}

export interface ModelGuildConfigSalesTracker {
  chain?: string;
  channel_id?: string;
  contract_address?: string;
  created_at?: string;
  guild_id?: string;
  id?: string;
  updated_at?: string;
}

export interface ModelGuildConfigTokenRole {
  created_at?: string;
  guild_id?: string;
  id?: number;
  required_amount?: number;
  role_id?: string;
  token?: ModelToken;
  token_id?: number;
  updated_at?: string;
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

export interface ModelGuildRole {
  guild_id?: string;
  name?: string;
  role_id?: number;
}

export interface ModelGuildUser {
  avatar?: string;
  guild_id?: string;
  id?: string;
  invited_by?: string;
  joined_at?: string;
  nickname?: string;
  roles?: string[];
  user_id?: string;
}

export interface ModelGuildUserXP {
  current_level_role?: ModelGuildConfigLevelRole;
  guild?: ModelDiscordGuild;
  guild_id?: string;
  guild_rank?: number;
  level?: number;
  next_level_role?: ModelGuildConfigLevelRole;
  nr_of_actions?: number;
  progress?: number;
  total_xp?: number;
  user?: ModelUser;
  user_id?: string;
}

export interface ModelMonikerConfig {
  amount?: number;
  created_at?: string;
  guild_id?: string;
  id?: string;
  moniker?: string;
  plural?: string;
  token?: ModelOffchainTipBotToken;
  token_id?: string;
  updated_at?: string;
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

export interface ModelOffchainTipBotToken {
  coin_gecko_id?: string;
  created_at?: string;
  icon?: string;
  id?: string;
  service_fee?: number;
  status?: number;
  token_id?: string;
  token_name?: string;
  token_symbol?: string;
  updated_at?: string;
}

export interface ModelProductMetadataEmojis {
  code?: string;
  discord_id?: string;
  id?: number;
  telegram_id?: string;
  twitter_id?: string;
}

export interface ModelProfileAirdropCampaign {
  airdrop_campaign?: ModelAirdropCampaign;
  airdrop_campaign_id?: number;
  id?: number;
  is_favorite?: boolean;
  profile_id?: string;
  status?: string;
}

export interface ModelQuest {
  action?: string;
  frequency?: number;
  id?: string;
  rewards?: ModelQuestReward[];
  routine?: string;
  title?: string;
}

export interface ModelQuestReward {
  id?: string;
  pass_id?: string;
  quest_id?: string;
  reward_amount?: number;
  reward_type?: ModelQuestRewardType;
  reward_type_id?: string;
}

export interface ModelQuestRewardType {
  id?: string;
  name?: string;
}

export interface ModelQuestUserList {
  action?: string;
  current?: number;
  end_time?: string;
  id?: string;
  is_claimed?: boolean;
  is_completed?: boolean;
  multiplier?: number;
  quest?: ModelQuest;
  quest_id?: string;
  routine?: string;
  start_time?: string;
  target?: number;
  user_id?: string;
}

export interface ModelQuestUserReward {
  claimed_at?: string;
  pass_id?: string;
  quest_id?: string;
  reward?: ModelQuestReward;
  reward_amount?: number;
  reward_id?: string;
  reward_type_id?: string;
  start_time?: string;
  user_id?: string;
}

export interface ModelSaleBotMarketplace {
  id?: number;
  name?: string;
  url?: string;
}

export interface ModelSaleBotTwitterConfig {
  address?: string;
  chain_id?: number;
  collection_name?: string;
  created_at?: string;
  id?: number;
  marketplace?: ModelSaleBotMarketplace;
  marketplace_id?: number;
  slug?: string;
  updated_at?: string;
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

export interface ModelUser {
  discriminator?: string;
  guild_users?: ModelGuildUser[];
  id?: string;
  nr_of_join?: number;
  username?: string;
}

export interface ModelUserFactionXpsMapping {
  academy_xp?: number;
  imperial_xp?: number;
  merchant_xp?: number;
  rebellio_xp?: number;
}

export interface ModelUserFeedback {
  command?: string;
  completed_at?: string;
  confirmed_at?: string;
  created_at?: string;
  discord_id?: string;
  feedback?: string;
  id?: UuidNullUUID;
  message_id?: string;
  status?: string;
}

export interface ModelUserTokenSupportRequest {
  channel_id?: string;
  coin_gecko_id?: string;
  created_at?: string;
  decimal?: number;
  guild_id?: string;
  icon?: string;
  id?: number;
  message_id?: string;
  status?: string;
  symbol?: string;
  token_address?: string;
  token_chain_id?: number;
  token_name?: string;
  updated_at?: string;
  user_discord_id?: string;
}

export interface ModelUserWalletWatchlist {
  copying?: ModelUserWalletWatchlistItem[];
  following?: ModelUserWalletWatchlistItem[];
  tracking?: ModelUserWalletWatchlistItem[];
}

export interface ModelUserWalletWatchlistItem {
  address?: string;
  alias?: string;
  chain_type?: string;
  created_at?: string;
  fetched_data?: boolean;
  is_owner?: boolean;
  net_worth?: number;
  type?: string;
  user_id?: string;
}

export interface ModelVault {
  created_at?: string;
  discord_guild?: ModelDiscordGuild;
  guild_id?: string;
  id?: number;
  name?: string;
  solana_wallet_address?: string;
  threshold?: string;
  total_amount_evm?: string;
  total_amount_solana?: string;
  updated_at?: string;
  vault_treasurers?: ModelVaultTreasurer[];
  wallet_address?: string;
  wallet_number?: number;
}

export interface ModelVaultTreasurer {
  created_at?: string;
  guild_id?: string;
  id?: number;
  role?: string;
  updated_at?: string;
  user_discord_id?: string;
  vault?: ModelVault;
  vault_id?: number;
}

export interface RequestAddNftWatchlistRequest {
  chain?: string;
  collection_address?: string;
  collection_symbol?: string;
  guild_id?: string;
  user_id?: string;
}

export interface RequestAddToWatchlistRequest {
  coin_gecko_id?: string;
  is_fiat?: boolean;
  symbol?: string;
  user_id?: string;
}

export interface RequestAddTokenPriceAlertRequest {
  alert_type?:
    | "price_reaches"
    | "price_rises_above"
    | "price_drops_to"
    | "change_is_over"
    | "change_is_under";
  frequency?: "only_once" | "once_a_day" | "always";
  price_by_percent?: number;
  symbol?: string;
  user_discord_id?: string;
  value?: number;
}

export interface RequestAssignVerifiedRoleRequest {
  guild_id: string;
  user_discord_id: string;
}

export interface RequestClaimQuestsRewardsRequest {
  quest_id?: string;
  routine?: string;
  user_id?: string;
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
  guildID?: string;
  number_of_tokens?: number;
  role_id?: string;
}

export interface RequestConfigLevelRoleRequest {
  guildID?: string;
  level?: number;
  role_id?: string;
}

export interface RequestCreateAirdropCampaignRequest {
  deadline_at?: string;
  detail?: string;
  id?: number;
  prev_airdrop_campaign_id?: number;
  reward_amount?: number;
  reward_token_symbol?: string;
  status?: string;
  title?: string;
}

export interface RequestCreateDefaultRoleRequest {
  guildID?: string;
  role_id?: string;
}

export interface RequestCreateGuildAdminRoleRequest {
  guildID?: string;
  role_ids?: string[];
}

export interface RequestCreateGuildTokenRole {
  address?: string;
  amount?: number;
  chain?: string;
  guildID?: string;
  role_id?: string;
}

export interface RequestCreateNFTCollectionRequest {
  address?: string;
  author?: string;
  chain?: string;
  chain_id?: string;
  channel_id?: string;
  guild_id?: string;
  message_id?: string;
  priority_flag?: boolean;
}

export interface RequestCreateProfileAirdropCampaignRequest {
  airdrop_campaign_id?: number;
  is_favorite?: boolean;
  status?: string;
}

export interface RequestCreateSalesTrackerConfigRequest {
  chain?: string;
  channel_id?: string;
  contract_address?: string;
  guild_id?: string;
}

export interface RequestCreateTipConfigNotify {
  channel_id?: string;
  guild_id?: string;
  token?: string;
}

export interface RequestCreateTwitterSaleConfigRequest {
  address?: string;
  chain_id?: number;
  marketplace?: string;
}

export interface RequestCreateUserRequest {
  guild_id?: string;
  id?: string;
  invited_by?: string;
  nickname?: string;
  username?: string;
}

export interface RequestCreateUserTokenSupportRequest {
  channel_id: string;
  guild_id: string;
  message_id: string;
  token_address: string;
  token_chain: string;
  user_discord_id: string;
}

export interface RequestDeleteJoinLeaveChannelConfigRequest {
  guild_id?: string;
}

export interface RequestDeleteMonikerConfigRequest {
  guild_id: string;
  moniker: string;
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

export type RequestGetTrackingWalletsRequest = object;

export interface RequestGuildConfigDefaultNftTickerRequest {
  chain_id?: number;
  collection_address?: string;
  guild_id?: string;
  query?: string;
  symbol?: string;
}

export interface RequestGuildConfigDefaultTickerRequest {
  default_ticker?: string;
  guild_id?: string;
  query?: string;
}

export interface RequestGuildIDRequest {
  guild_id?: string;
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

export interface RequestOffchainTransferRequest {
  all?: boolean;
  amount?: number;
  amount_string?: string;
  chain_id?: string;
  channel_id?: string;
  each?: boolean;
  guild_id?: string;
  image?: string;
  message?: string;
  platform?: string;
  recipients?: string[];
  sender?: string;
  token?: string;
  transfer_type?: string;
}

export interface RequestRoleReactionRequest {
  guild_id?: string;
  message_id?: string;
  reaction?: string;
}

export interface RequestRoleReactionUpdateRequest {
  channel_id?: string;
  guildID?: string;
  message_id?: string;
  reaction?: string;
  role_id?: string;
}

export interface RequestSendUserXPRequest {
  amount?: number;
  each?: boolean;
  guild_id?: string;
  recipients?: string[];
}

export interface RequestSwapRequest {
  aggregator?: string;
  chainName: string;
  routeSummary?: any;
  swapData?: any;
  userDiscordId: string;
}

export interface RequestTrackWalletRequest {
  address: string;
  alias?: string;
  chain_type: string;
  channel_id?: string;
  is_owner?: boolean;
  message_id?: string;
  type: string;
}

export interface RequestUnlinkBinance {
  discord_user_id?: string;
}

export interface RequestUpdateGuildRequest {
  active?: boolean;
  global_xp?: boolean;
  left_at?: string;
  log_channel?: string;
}

export interface RequestUpdateQuestProgressRequest {
  action?: string;
  guild_id?: string;
  user_id?: string;
}

export interface RequestUpdateTrackingInfoRequest {
  /** Request body, only update the following fields */
  alias?: string;
}

export interface RequestUpdateUserFeedbackRequest {
  id?: string;
  status?: string;
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
  emoji?: string;
  guild_id?: string;
  msg?: string;
  sticker?: string;
}

export interface RequestUpsertGuildConfigTipRangeRequest {
  guild_id?: string;
  max?: number;
  min?: number;
}

export interface RequestUpsertGuildDefaultCurrencyRequest {
  guild_id?: string;
  symbol?: string;
}

export interface RequestUpsertGuildTokenConfigRequest {
  active?: boolean;
  guild_id?: string;
  symbol?: string;
}

export interface RequestUpsertJoinLeaveChannelConfigRequest {
  channel_id?: string;
  guild_id?: string;
}

export interface RequestUpsertMonikerConfigRequest {
  amount: number;
  guild_id: string;
  moniker: string;
  plural?: string;
  token: string;
}

export interface RequestUpsertUserTag {
  guild_id?: string;
  is_active?: boolean;
  user_id?: string;
}

export interface RequestUpsertWelcomeConfigRequest {
  channel_id?: string;
  guild_id?: string;
  welcome_message?: string;
}

export interface RequestUserFeedbackRequest {
  avatar?: string;
  command?: string;
  discord_id?: string;
  feedback?: string;
  message_id?: string;
  username?: string;
}

export interface ResponseAddToWatchlistResponse {
  data?: ResponseAddToWatchlistResponseData;
}

export interface ResponseAddToWatchlistResponseData {
  base_coin?: ResponseGetCoinResponse;
  base_suggestions?: ModelCoingeckoSupportedTokens[];
  target_coin?: ResponseGetCoinResponse;
  target_suggestions?: ModelCoingeckoSupportedTokens[];
}

export interface ResponseAddTokenPriceAlertResponse {
  data?: ResponseTokenPriceAlertResponseData;
}

export interface ResponseAirdropCampaignResponse {
  data?: ModelAirdropCampaign;
}

export interface ResponseAirdropCampaignStatResponse {
  data?: ModelAirdropStatusCount[];
}

export interface ResponseAirdropCampaignsResponse {
  data?: ModelAirdropCampaign[];
}

export interface ResponseAssetPlatformResponseData {
  chain_identifier?: number;
  id?: string;
  name?: string;
  shortname?: string;
}

export interface ResponseChainGasTrackerResponseData {
  data?: ResponseGasTrackerResponse;
}

export interface ResponseClaimQuestsRewardsResponse {
  data?: ResponseClaimQuestsRewardsResponseData;
}

export interface ResponseClaimQuestsRewardsResponseData {
  rewards?: ModelQuestUserReward[];
}

export interface ResponseCoin {
  coin_id?: number;
  id?: string;
  large?: string;
  market_cap_rank?: number;
  name?: string;
  price_btc?: number;
  score?: number;
  slug?: string;
  small?: string;
  symbol?: string;
  thumb?: string;
}

export interface ResponseCoinGeckoInfoKeyValue {
  key?: string;
  value?: string;
}

export interface ResponseCoinGeckoInfoResponse {
  communities?: ResponseCoinGeckoInfoKeyValue[];
  contracts?: ResponseCoinGeckoInfoKeyValue[];
  description_lines?: string[];
  explorers?: ResponseCoinGeckoInfoKeyValue[];
  tags?: ResponseCoinGeckoInfoKeyValue[];
  wallets?: ResponseCoinGeckoInfoKeyValue[];
  websites?: ResponseCoinGeckoInfoKeyValue[];
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
  is_default?: boolean;
  is_pair?: boolean;
  market_cap?: number;
  market_cap_rank?: number;
  name?: string;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: {
    price?: number[];
  };
  symbol?: string;
}

export interface ResponseCoinPlatformDetailData {
  contract_address?: string;
  decimal_place?: number;
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
  chain_id?: number;
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

export interface ResponseConfigNotifyResponse {
  channel_id?: string;
  created_at?: string;
  guild_id?: string;
  id?: string;
  token?: string;
  total_transaction?: number;
  updated_at?: string;
}

export interface ResponseCreateGuildTokenRole {
  data?: ModelGuildConfigTokenRole;
}

export interface ResponseCreateNFTCollectionResponse {
  data?: ModelNFTCollection;
}

export interface ResponseCreateTwitterSaleConfigResponse {
  data?: ModelSaleBotTwitterConfig;
}

export interface ResponseCreateUserTokenSupportRequest {
  data?: ModelUserTokenSupportRequest;
}

export interface ResponseDataFilterConfigByReaction {
  data?: ResponseRoleReactionResponse;
  /** page index */
  page?: number;
  /** page size */
  size?: number;
  total?: number;
}

export interface ResponseDataListRoleReactionResponse {
  data?: ResponseListRoleReactionResponse;
  /** page index */
  page?: number;
  /** page size */
  size?: number;
  total?: number;
}

export interface ResponseDefaultRole {
  guild_id?: string;
  role_id?: string;
}

export interface ResponseDefaultRoleResponse {
  data?: ResponseDefaultRole;
}

export interface ResponseDiscordGuildResponse {
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

export interface ResponseDiscordGuildRole {
  color?: number;
  hoist?: boolean;
  icon?: string;
  id?: string;
  managed?: boolean;
  mentionable?: boolean;
  name?: string;
  permissions?: string;
  position?: number;
  unicode_emoji?: string;
}

export interface ResponseGasTrackerResponse {
  chain?: string;
  est_fast_time?: string;
  est_propose_time?: string;
  est_safe_time?: string;
  fast_gas_price?: string;
  propose_gas_price?: string;
  safe_gas_price?: string;
}

export interface ResponseGasTrackerResponseData {
  data?: ResponseGasTrackerResponse[];
}

export interface ResponseGetCoinResponse {
  asset_platform?: ResponseAssetPlatformResponseData;
  asset_platform_id?: string;
  block_time_in_minutes?: number;
  categories?: string[];
  coingecko_info?: ResponseCoinGeckoInfoResponse;
  coingecko_rank?: number;
  coingecko_score?: number;
  community_data?: any;
  contract_address?: string;
  description?: Record<string, string>;
  detail_platforms?: Record<string, ResponseCoinPlatformDetailData>;
  developer_data?: any;
  genesis_date?: any;
  hashing_algorithm?: any;
  id?: string;
  image?: ResponseCoinImage;
  links?: any;
  localization?: Record<string, string>;
  market_cap_rank?: number;
  market_data?: ResponseMarketData;
  name?: string;
  platforms?: any;
  sentiment_votes_down_percentage?: number;
  sentiment_votes_up_percentage?: number;
  symbol?: string;
  tickers?: ResponseTickerData[];
  watchlist_users?: number;
}

export interface ResponseGetCoinResponseWrapper {
  data?: ResponseGetCoinResponse;
}

export interface ResponseGetCoinsMarketDataResponse {
  data?: ResponseCoinMarketItemData[];
}

export interface ResponseGetCollectionCountResponse {
  data?: ResponseNFTCollectionCount;
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

export interface ResponseGetFiatHistoricalExchangeRatesResponse {
  from?: string;
  latest_rate?: number;
  rates?: number[];
  times?: string[];
  to?: string;
}

export interface ResponseGetGmConfigResponse {
  data?: ModelGuildConfigGmGn;
  message?: string;
}

export interface ResponseGetGuildDefaultNftTickerResponse {
  data?: ModelGuildConfigDefaultCollection;
}

export interface ResponseGetGuildDefaultTickerResponse {
  data?: ModelGuildConfigDefaultTicker;
}

export interface ResponseGetGuildLevelUpMessage {
  data?: ModelGuildConfigLevelupMessage;
}

export interface ResponseGetGuildResponse {
  active?: boolean;
  alias?: string;
  bot_scopes?: string[];
  global_xp?: boolean;
  icon?: string;
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

export interface ResponseGetLevelRoleConfigsResponse {
  data?: ModelGuildConfigLevelRole[];
  /** page index */
  page?: number;
  /** page size */
  size?: number;
  total?: number;
}

export interface ResponseGetListAllChainsResponse {
  data?: ModelChain[];
}

export interface ResponseGetListGuildDefaultTickerResponse {
  data?: ModelGuildConfigDefaultTicker[];
}

export interface ResponseGetNFTActivityData {
  data?: ResponseIndexerNFTActivityData[];
  metadata?: UtilPagination;
}

export interface ResponseGetNFTActivityResponse {
  data?: ResponseGetNFTActivityData;
}

export interface ResponseGetNFTCollectionByAddressChain {
  address?: string;
  author?: string;
  chain_id?: string;
  created_at?: string;
  description?: string;
  discord?: string;
  erc_format?: string;
  id?: string;
  image?: string;
  is_verified?: boolean;
  marketplaces?: string[];
  name?: string;
  symbol?: string;
  twitter?: string;
  website?: string;
}

export interface ResponseGetNFTCollectionByAddressChainResponse {
  data?: ResponseGetNFTCollectionByAddressChain;
}

export interface ResponseGetNftWatchlist {
  floor_price?: number;
  id?: string;
  image?: string;
  is_pair?: boolean;
  name?: string;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: ResponseSparkLineIn7D;
  symbol?: string;
  token?: ResponseIndexerToken;
}

export interface ResponseGetNftWatchlistResponse {
  data?: ResponseGetNftWatchlist[];
}

export interface ResponseGetOneWalletResponse {
  data?: ModelUserWalletWatchlistItem;
}

export interface ResponseGetSaleTwitterConfigResponse {
  data?: ModelSaleBotTwitterConfig[];
}

export interface ResponseGetSalesTrackerConfigResponse {
  data?: ModelGuildConfigSalesTracker[];
}

export interface ResponseGetSuggestionNFTCollectionsResponse {
  data?: ResponseCollectionSuggestions[];
}

export interface ResponseGetSupportedChains {
  data?: string[];
}

export interface ResponseGetSupportedTokenResponse {
  data?: ModelToken;
}

export interface ResponseGetSupportedTokensResponse {
  data?: ModelToken[];
}

export interface ResponseGetTopGainerLoser {
  top_gainers?: ResponseGetTopGainerLoserCoin[];
  top_losers?: ResponseGetTopGainerLoserCoin[];
}

export interface ResponseGetTopGainerLoserCoin {
  id?: string;
  image?: string;
  market_cap_rank?: number;
  name?: string;
  symbol?: string;
  usd?: number;
  usd_14d_change?: number;
  usd_1h_change?: number;
  usd_1y_change?: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  usd_30d_change?: number;
  usd_60d_change?: number;
  usd_7d_change?: number;
}

export interface ResponseGetTrackingWalletsResponse {
  data?: ModelUserWalletWatchlist;
}

export interface ResponseGetTrendingSearch {
  coins?: ResponseGetTrendingSearchCoin[];
  /** this field coingecko return empty */
  exchanges?: any;
}

export interface ResponseGetTrendingSearchCoin {
  item?: ResponseCoin;
}

export interface ResponseGetUserCurrentGMStreakResponse {
  data?: ModelDiscordUserGMStreak;
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
}

export interface ResponseGetUserQuestListResponse {
  data?: ModelQuestUserList[];
}

export interface ResponseGetUserResponse {
  data?: ResponseUser;
}

export interface ResponseGetVaultsResponse {
  data?: ModelVault[];
}

export interface ResponseGetWatchlistResponse {
  data?: ResponseCoinMarketItemData[];
  metadata?: ResponsePaginationResponse;
}

export interface ResponseGetWelcomeChannelConfigResponse {
  data?: ModelGuildConfigWelcomeChannel;
  message?: string;
}

export interface ResponseGuildConfigDefaultCurrencyResponse {
  created_at?: string;
  guild_id?: string;
  tip_bot_token?: ModelOffchainTipBotToken;
  updated_at?: string;
}

export interface ResponseGuildConfigTipRangeResponse {
  created_at?: string;
  guild_id?: string;
  max?: number;
  min?: number;
  updated_at?: string;
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

export interface ResponseIndexerGetNFTTokenTickersResponse {
  data?: ResponseIndexerNFTTokenTickersData;
}

export interface ResponseIndexerGetNFTTokensResponse {
  data?: ResponseIndexerNFTTokenDetailData[];
  page?: number;
  size?: number;
  total?: number;
}

export interface ResponseIndexerNFTActivityData {
  chain_id?: number;
  contract_address?: string;
  created_time?: string;
  event_type?: string;
  from_address?: string;
  id?: number;
  last_update_time?: string;
  listing_price?: string;
  listing_price_obj?: ResponseIndexerPrice;
  listing_status?: string;
  listing_type?: string;
  payment_token?: number;
  platform_id?: number;
  quantity?: string;
  sold_price?: string;
  sold_price_obj?: ResponseIndexerPrice;
  to_address?: string;
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
  price_change_1d?: string;
  price_change_30d?: string;
  price_change_7d?: string;
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

export interface ResponseIndexerNFTTokenTickersData {
  collection_address?: string;
  description?: string;
  floor_price?: ResponseIndexerPrice;
  image?: string;
  image_cdn?: string;
  last_sale_at?: string;
  last_sale_price?: ResponseIndexerPrice;
  name?: string;
  price_change_30d?: string;
  price_change_365d?: string;
  price_change_90d?: string;
  price_change_percentage_30d?: string;
  price_change_percentage_365d?: string;
  price_change_percentage_90d?: string;
  rarity_rank?: number;
  rarity_score?: string;
  rarity_tier?: string;
  tickers?: ResponseIndexerTickers;
  token_id?: string;
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

export interface ResponseListAllCustomTokenResponse {
  data?: ModelToken[];
}

export interface ResponseListAllNFTCollectionsResponse {
  data?: ModelNFTCollection[];
}

export interface ResponseListConfigNotifyResponse {
  data?: ResponseConfigNotifyResponse[];
}

export interface ResponseListEmojisResponse {
  data?: ModelProductMetadataEmojis[];
}

export interface ResponseListGuildAdminRoles {
  data?: ModelGuildConfigAdminRole[];
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

export interface ResponseListGuildTokenRoles {
  data?: ModelGuildConfigTokenRole[];
  meta?: Record<string, any>;
}

export interface ResponseListMyGuildsResponse {
  data?: ResponseDiscordGuildResponse[];
}

export interface ResponseListRoleReactionResponse {
  configs?: ResponseRoleReactionByMessage[];
  guild_id?: string;
  success?: boolean;
}

export interface ResponseListTokenPriceAlertResponse {
  alert_type?: string;
  created_at?: string;
  currency?: string;
  frequency?: string;
  price?: number;
  snoozed_to?: string;
  symbol?: string;
  updated_at?: string;
  user_discord_id?: string;
}

export interface ResponseMarketData {
  ath?: Record<string, number>;
  ath_change_percentage?: Record<string, number>;
  ath_date?: any;
  atl?: Record<string, number>;
  circulating_supply?: number;
  current_price?: Record<string, number>;
  fdv_to_tvl_ratio?: any;
  fully_diluted_valuation?: Record<string, number>;
  high_24h?: Record<string, number>;
  low_24h?: Record<string, number>;
  market_cap?: Record<string, number>;
  market_cap_change_24h_in_currency?: Record<string, number>;
  market_cap_change_percentage_24h_in_currency?: Record<string, number>;
  market_cap_rank?: number;
  max_supply?: number;
  mcap_to_tvl_ratio?: any;
  price_change_24h?: number;
  price_change_24h_in_currency?: Record<string, number>;
  price_change_percentage_14d?: number;
  price_change_percentage_14d_in_currency?: Record<string, number>;
  price_change_percentage_1h_in_currency?: Record<string, number>;
  price_change_percentage_1y?: number;
  price_change_percentage_1y_in_currency?: Record<string, number>;
  price_change_percentage_200d?: number;
  price_change_percentage_200d_in_currency?: Record<string, number>;
  price_change_percentage_24h?: number;
  price_change_percentage_24h_in_currency?: Record<string, number>;
  price_change_percentage_30d?: number;
  price_change_percentage_30d_in_currency?: Record<string, number>;
  price_change_percentage_60d?: number;
  price_change_percentage_60d_in_currency?: Record<string, number>;
  price_change_percentage_7d?: number;
  price_change_percentage_7d_in_currency?: Record<string, number>;
  roi?: any;
  total_market_cap?: Record<string, number>;
  total_supply?: number;
  total_value_locked?: any;
  total_volume?: Record<string, number>;
}

export interface ResponseMonikerConfigData {
  moniker?: ModelMonikerConfig;
  value?: number;
}

export interface ResponseMonikerConfigResponse {
  data?: ResponseMonikerConfigData[];
}

export interface ResponseNFTChainCollectionCount {
  chain?: ModelChain;
  count?: number;
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
  data?: ResponseNFTChainCollectionCount[];
  total?: number;
}

export interface ResponseNFTCollectionsData {
  data?: ModelNFTCollection[];
  metadata?: UtilPagination;
}

export interface ResponseNFTCollectionsResponse {
  data?: ResponseNFTCollectionsData;
}

export interface ResponseNFTNewListed {
  data?: ModelNewListedNFTCollection[];
  metadata?: UtilPagination;
}

export interface ResponseNFTNewListedResponse {
  data?: ResponseNFTNewListed;
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
  floor_price?: string;
  item_url?: string;
  listing_price?: string;
  listing_status?: string;
  payment_token?: string;
  payment_token_decimals?: string;
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

export interface ResponseNftWatchlistSuggest {
  default_symbol?: ResponseCollectionSuggestions;
  suggestions?: ResponseCollectionSuggestions[];
}

export interface ResponseNftWatchlistSuggestResponse {
  data?: ResponseNftWatchlistSuggest;
}

export interface ResponseOffchainTipBotTransferToken {
  amount_each?: number;
  /**
   * SenderID    string  `json:"sender_id"`
   * Recipients  string  `json:"recipient_id"`
   */
  id?: string;
  total_amount?: number;
  tx_id?: number;
}

export interface ResponseOffchainTipBotTransferTokenResponse {
  data?: ResponseOffchainTipBotTransferToken[];
}

export interface ResponsePaginationResponse {
  /** page index */
  page?: number;
  /** page size */
  size?: number;
  total?: number;
}

export interface ResponseProfileAirdropCampaignResponse {
  data?: ModelProfileAirdropCampaign;
}

export interface ResponseProfileAirdropCampaignsResponse {
  data?: ModelProfileAirdropCampaign[];
}

export interface ResponseProfileApiKeyResponse {
  api_key?: string;
  created_at?: string;
  profile_id?: string;
  updated_at?: string;
}

export interface ResponseResponseDataMessage {
  data?: ResponseResponseMessage;
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
  channel_id?: string;
  message_id?: string;
  roles?: ResponseRole[];
}

export interface ResponseRoleReactionConfigResponse {
  channel_id?: string;
  guild_id?: string;
  message_id?: string;
  roles?: ResponseRole[];
  success?: boolean;
}

export interface ResponseRoleReactionResponse {
  channel_id?: string;
  guild_id?: string;
  message_id?: string;
  role?: ResponseRole;
}

export interface ResponseRouteToken {
  address?: string;
  chain_id?: number;
  chain_name?: string;
  coingecko_id?: string;
  created_at?: string;
  decimals?: number;
  id?: number;
  logo_uri?: string;
  name?: string;
  symbol?: string;
  updated_at?: string;
}

export interface ResponseSearchCoinResponse {
  data?: ModelCoingeckoSupportedTokens[];
}

export interface ResponseSparkLineIn7D {
  price?: number[];
}

export interface ResponseSwapRoute {
  aggregator?: string;
  routeSummary?: any;
  routerAddress?: string;
  swapData?: any;
  tokenIn?: ResponseRouteToken;
  tokenOut?: ResponseRouteToken;
}

export interface ResponseSwapRouteResponse {
  chainName?: string;
  code?: number;
  data?: ResponseSwapRoute;
  message?: string;
  provider?: string;
}

export interface ResponseSwapRouteResponseData {
  data?: ResponseSwapRouteResponse;
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

export interface ResponseTokenPriceAlertResponseData {
  alert_type?: string;
  currency?: string;
  frequency?: string;
  price_by_percent?: number;
  snoozed_to?: string;
  symbol?: string;
  user_discord_id?: string;
  value?: number;
}

export interface ResponseTopUser {
  author?: ModelGuildUserXP;
  leaderboard?: ModelGuildUserXP[];
  metadata?: ResponsePaginationResponse;
}

export interface ResponseUnlinkBinance {
  message?: string;
}

export interface ResponseUpdateUserFeedbackResponse {
  data?: ModelUserFeedback;
}

export interface ResponseUser {
  discriminator?: string;
  guild_users?: ResponseGetGuildUserResponse[];
  id?: string;
  nr_of_join?: number;
  username?: string;
}

export interface ResponseUserFeedbackResponse {
  data?: ModelUserFeedback[];
  page?: number;
  size?: number;
  total?: number;
}

export interface UtilPagination {
  page?: number;
  size?: number;
  total?: number;
}

export interface UuidNullUUID {
  uuid?: string;
  /** Valid is true if UUID is not NULL */
  valid?: boolean;
}
