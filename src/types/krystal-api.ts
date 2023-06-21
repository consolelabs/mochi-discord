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

export interface AddressCollectible {
  collectibleAddress?: string;
  collectibleLogo?: string;
  collectibleName?: string;
  collectibleSymbol?: string;
  collectionDetail?: NftCollection;
  items?: AddressNftItem[];
  nftType?: string[];
}

export interface AddressExternalData {
  animation?: string;
  attributes?: any;
  description?: string;
  image?: string;
  name?: string;
}

export interface AddressNftItem {
  collectibleName?: string;
  currentPrice?: BigFloat;
  externalData?: AddressExternalData;
  favorite?: boolean;
  lastSalePrice?: BigFloat;
  ownerAddress?: string;
  paymentToken?: string;
  tokenBalance?: string;
  tokenID?: string;
  tokenUrl?: string;
}

export interface AddressPoolBalance {
  project?: string;
  token?: TokenToken;
  underlying?: AddressTokenBalance[];
}

export interface AddressQuote {
  rate?: number;
  symbol?: string;
  value?: number;
}

export interface AddressSPLTokenBalance {
  balance?: string;
  quotes?: Record<string, AddressQuote>;
  token?: TokenSPLToken;
}

export interface AddressSolTokenTransferObj {
  amount?: string;
  destination?: string;
  destinationOwner?: string;
  source?: string;
  sourceOwner?: string;
  token?: {
    address?: string;
    decimals?: number;
    icon?: string;
    symbol?: string;
  };
}

export interface AddressSolTransaction {
  blockTime?: number;
  details?: AddressSolTransactionDetail;
  fee?: number;
  lamport?: number;
  signer?: string[];
  slot?: number;
  status?: string;
  txHash?: string;
  userAddress?: string;
}

export interface AddressSolTransactionDetail {
  inputAccount?: {
    account?: string;
    postBalance?: number;
    preBalance?: number;
    signer?: boolean;
    writable?: boolean;
  }[];
  raydiumTransactions?: {
    swap?: {
      event?: {
        amount?: string;
        decimals?: number;
        destination?: string;
        destinationOwner?: string;
        source?: string;
        symbol?: string;
        tokenAddress?: string;
        type?: string;
      }[];
      programId?: string;
    };
  }[];
  recentBlockhash?: string;
  solTransfers?: {
    amount?: number;
    destination?: string;
    source?: string;
  }[];
  tokenTransfers?: AddressSolTokenTransferObj[];
  unknownTransfers?: {
    event?: {
      amount?: any;
      decimals?: number;
      destination?: string;
      source?: string;
      symbol?: string;
      tokenAddress?: string;
      type?: string;
    }[];
    programId?: string;
  }[];
}

export interface AddressTokenBalance {
  balance?: string;
  quotes?: Record<string, AddressQuote>;
  token?: TokenToken;
}

export interface AddressTransaction {
  blockNumber?: number;
  extraData?: Record<string, any>;
  from?: string;
  gasCost?: string;
  gasCostQuote?: number;
  gasLimit?: number;
  gasPrice?: string;
  gasPriceQuote?: number;
  gasUsed?: number;
  hash?: string;
  logs?: any[];
  nonce?: number;
  status?: string;
  timestamp?: number;
  to?: string;
  type?: string;
  value?: string;
  valueQuote?: number;
}

export interface AddressutilAddress {
  chainType?: string;
  value?: number[];
}

export interface AdvancedsearchAdvancedData {
  portfolios?: AdvancedsearchPortfolio[];
  tokens?: AdvancedsearchTokenInfo[];
}

export interface AdvancedsearchPortfolio {
  ens?: string;
  id?: string;
}

export interface AdvancedsearchTokenInfo {
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
  decimals?: number;
  id?: string;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
  tvl?: number;
  usdValue?: number;
}

export interface ApiAssetsOutput {
  assets?: MktAsset[];
  timestamp?: number;
}

export interface ApiBannersOutput {
  banners?: Record<string, MktBanner>;
  timestamp?: number;
}

export interface ApiBuildClaimRewardsTxInput {
  chainId: number;
  from: string;
  platform: string;
}

export interface ApiBuildEarningClaimTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount?: string;
  userAddress: string;
}

export interface ApiBuildStakeTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount: string;
  userAddress: string;
}

export interface ApiBuildUnstakeTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount: string;
  userAddress: string;
}

export interface ApiBuyCryptoOutput {
  eternalRedirectUrl?: string;
  timestamp?: number;
}

export interface ApiCampaignOutput {
  bannerUrl?: string;
  chainID?: number;
  description?: string;
  expired?: number;
  logoUrl?: string;
  network?: string;
  title?: string;
}

export interface ApiChainInfo {
  id?: number;
  logo?: string;
  name?: string;
}

export interface ApiClaimCodeInput {
  address: string;
  code: string;
}

export interface ApiClaimCodeOutput {
  message?: string;
  success?: boolean;
}

export interface ApiCodeOutput {
  campaign?: ApiCampaignOutput;
  claimTx?: string;
  code?: string;
  reward?: string;
  status?: string;
  txnStatus?: string;
}

export interface ApiCommonBaseOutput {
  timestamp?: number;
  tokens?: TokenToken[];
}

export interface ApiCrypto {
  cryptoCurrency?: string;
  cryptoLogo?: string;
  fiatCurrency?: string;
  fiatLogo?: string;
  fiatName?: string;
  maxLimit?: number;
  minLimit?: number;
  networks?: ConfigsNetwork[];
  quotation?: number;
}

export interface ApiCryptosOutput {
  data?: ApiCrypto[];
  timestamp?: number;
}

export interface ApiEarningOption {
  apy?: number;
  chain?: ApiChainInfo;
  platforms?: ApiPlatform[];
  token?: TokenToken;
  tvl?: number;
}

export interface ApiEarningToken {
  address?: string;
  addressStr?: string;
  decimals?: number;
  desc?: string;
  exchangeRate?: string;
  logo?: string;
  name?: string;
  requireApprove?: boolean;
  symbol?: string;
  tag?: string;
}

export interface ApiEarningValidation {
  minStakeAmount?: number;
  minUnstakeAmount?: number;
  stakeInterval?: number;
}

export interface ApiGetFlagOutput {
  address?: string;
  flags?: Record<string, boolean>;
  timestamp?: number;
}

export interface ApiListOrdersOutput {
  data?: OnrampFiatOrder[];
  timestamp?: number;
}

export interface ApiListTokenDetailsOutput {
  result?: ApiTokenDetails[];
  timestamp?: number;
}

export interface ApiOptionDetailOutput {
  apy?: number;
  chain?: ApiChainInfo;
  /** APY float64 */
  earningTokens?: ApiEarningToken[];
  platform?: ApiPlatform;
  poolAddress?: string;
  requireApprove?: boolean;
  rewardAPY?: number;
  token?: TokenToken;
  validation?: ApiEarningValidation;
  wrap?: {
    isWrappable?: boolean;
    wrapAddress?: string;
  };
}

export interface ApiPlatform {
  apy?: number;
  desc?: string;
  logo?: string;
  name?: string;
  rewardAPY?: number;
  status?: ApiStatus;
  tvl?: number;
  type?: string;
}

export interface ApiPromotionOutput {
  codes?: ApiCodeOutput[];
}

export interface ApiSearchOutput {
  data?: AdvancedsearchAdvancedData;
  timestamp?: number;
}

export interface ApiStatus {
  detail?: string;
  value?: string;
}

export interface ApiSupportedChainOutput {
  id?: number;
  name?: string;
}

export interface ApiTokenDetails {
  address?: string;
  cgkId?: string;
  chainId?: number;
  chainType?: string;
  decimals?: number;
  description?: string;
  id?: string;
  links?: TokenlistWebsite;
  logo?: string;
  markets?: Record<string, PricingMarketData>;
  name?: string;
  onChainDataFetched?: boolean;
  showToUser?: boolean;
  socialDataFetched?: boolean;
  symbol?: string;
  tag?: string;
  website?: TokenlistWebsite;
}

export interface ApiTokenDetailsOutput {
  result?: ApiTokenDetails;
  timestamp?: number;
}

export interface ApiTokenListOutput {
  timestamp?: number;
  tokens?: TokenlistToken[];
}

export interface ApiTotalBalanceItem {
  address?: string;
  chain?: string;
  chainID?: number;
  percentage?: number;
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface ApiTotalBalanceSummary {
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface ApiTotalBalancesData {
  balances?: ApiTotalBalanceItem[];
  summary?: ApiTotalBalanceSummary;
}

export interface ApiTotalBalancesOutput {
  data?: ApiTotalBalancesData;
  timestamp?: number;
}

export interface ApiUpdateEarningOptionInput {
  chainId?: number;
  platform?: string;
  status?: string;
  statusDetail?: string;
  token?: string;
  type?: string;
}

export interface ApiReferralOverviewOutput {
  bonusRatio?: number;
  bonusVol?: number;
  codeStats?: Record<string, ReferralAccountReferralCodeStats>;
  error?: string;
  nextRewardAmount?: number;
  rewardAmount?: number;
  rewardToken?: TokenToken;
  totalVol?: number;
  volForNextReward?: number;
}

export interface ApiReferralTiersOutput {
  tiers?: RewardRewardTier[];
}

export interface ApiAdminCreateTokenOutput {
  status?: string;
}

export interface ApiAdminDeleteTokenOutput {
  status?: string;
}

export interface ApiAdminTokenInfoData {
  address?: string;
  cgkId?: string;
  chainId?: number;
  decimals?: number;
  id?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface ApiAdminUpdateTokenOutput {
  status?: string;
}

export interface ApiMultichainBalanceByChain {
  balances?: ApiMultichainTokenBalanceWithQuote[];
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
  error?: string;
}

export interface ApiMultichainDistributionBalanceWithQuote {
  address?: string;
  addressStr?: string;
  current?: string;
  currentQuote?: Record<string, ApiMultichainQuote>;
  decimal?: number;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
  unclaimed?: string;
  unclaimedQuote?: Record<string, ApiMultichainQuote>;
}

export interface ApiMultichainDistributionLendingItem {
  balances?: ApiMultichainDistributionBalanceWithQuote[];
  chainID?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface ApiMultichainDistributionLendingOutput {
  data?: ApiMultichainDistributionLendingItem[];
}

export interface ApiMultichainEnrichedLpData {
  lpPoolData?: ApiMultichainEnrichedLpPoolData;
  lpPositionData?: ApiMultichainEnrichedLpPositionData;
}

export interface ApiMultichainEnrichedLpPoolData {
  fee?: number;
  poolAddress?: string;
  token0?: TokenutilToken;
  token1?: TokenutilToken;
}

export interface ApiMultichainEnrichedLpPositionData {
  avgConvertPrice?: BigFloat;
  closedBlockTime?: number;
  currentPrice?: number;
  currentToken0Amount?: string;
  currentToken0Value?: number;
  currentToken1Amount?: string;
  currentToken1Value?: number;
  depositedTime?: number;
  impermanentLoss?: number;
  isCovertFromToken0?: boolean;
  maxPrice?: number;
  minPrice?: number;
  nfpmAddress?: string;
  pnl?: number;
  status?: string;
  tokenId?: string;
  totalFeeEarned0?: string;
  totalFeeEarned0LastWithdraw?: string;
  totalFeeEarned0LastWithdrawUsd?: number;
  totalFeeEarned0Usd?: number;
  totalFeeEarned1?: string;
  totalFeeEarned1LastWithdraw?: string;
  totalFeeEarned1LastWithdrawUsd?: number;
  totalFeeEarned1Usd?: number;
  totalToken0Amount?: string;
  totalToken0Value?: number;
  totalToken1Amount?: string;
  totalToken1Value?: number;
  yesterdayEarning?: number;
}

export interface ApiMultichainLendingAccountInfo {
  balances?: ApiMultichainLendingBalanceWithQuote[];
  name?: string;
}

export interface ApiMultichainLendingBalanceWithQuote {
  address?: string;
  addressStr?: string;
  decimals?: number;
  distributionBorrowRate?: number;
  distributionSupplyRate?: number;
  interestBearingTokenAddress?: string;
  interestBearingTokenBalance?: string;
  interestBearingTokenDecimals?: number;
  interestBearingTokenSymbol?: string;
  logo?: string;
  name?: string;
  requiresApproval?: boolean;
  stableBorrowBalance?: string;
  stableBorrowQuotes?: Record<string, ApiMultichainQuote>;
  stableBorrowRate?: number;
  supplyBalance?: string;
  supplyQuotes?: Record<string, ApiMultichainQuote>;
  supplyRate?: number;
  symbol?: string;
  tag?: string;
  variableBorrowBalance?: string;
  variableBorrowQuotes?: Record<string, ApiMultichainQuote>;
  variableBorrowRate?: number;
}

export interface ApiMultichainLendingOutput {
  data?: ApiMultichainMultichainLendingItem[];
}

export interface ApiMultichainListNativeWrappedTokens {
  data?: Record<string, Record<string, ApiMultichainNativeWrappedToken>>;
}

export interface ApiMultichainMultichainLendingItem {
  balances?: ApiMultichainLendingAccountInfo[];
  chainID?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface ApiMultichainNativeWrappedToken {
  nativeToken?: TokenTokenV2;
  wrappedToken?: TokenTokenV2;
}

export interface ApiMultichainNftBalancesByChain {
  balances?: AddressCollectible[];
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface ApiMultichainNftBalancesOutput {
  data?: ApiMultichainNftBalancesByChain[];
  timestamp?: number;
}

export interface ApiMultichainNftDetail {
  collectibleAddress?: string;
  collectibleLogo?: string;
  collectibleName?: string;
  collectibleSymbol?: string;
  collectionDetail?: NftCollection;
  item?: AddressNftItem;
  nftType?: string[];
}

export interface ApiMultichainNftDetailOutput {
  data?: ApiMultichainNftDetail;
  timestamp?: number;
}

export interface ApiMultichainQuote {
  price?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange24hPercentage?: number;
  symbol?: string;
  timestamp?: number;
  value?: number;
}

export interface ApiMultichainRefetchNftMetadataOutput {
  data?: NftNftWithMetadata[];
  timestamp?: number;
}

export interface ApiMultichainRefreshCollectionOutput {
  success?: boolean;
  timestamp?: number;
}

export interface ApiMultichainTokenBalanceOutput {
  data?: ApiMultichainBalanceByChain[];
  timestamp?: number;
}

export interface ApiMultichainTokenBalanceWithQuote {
  assetType?: string;
  balance?: string;
  lpData?: ApiMultichainEnrichedLpData;
  quotes?: Record<string, ApiMultichainQuote>;
  sparkline?: number[];
  token?: TokenutilToken;
  tokenId?: string;
  tokenType?: string;
  underlying?: ApiMultichainTokenBalanceWithQuote[];
  userAddress?: string;
  web3ProjectAddress?: string;
}

export interface ApiMultichainTokenDetails {
  address?: string;
  cgkId?: string;
  chainId?: number;
  chainType?: string;
  decimals?: number;
  description?: string;
  id?: string;
  logo?: string;
  markets?: Record<string, PricingMarketData>;
  name?: string;
  onChainDataFetched?: boolean;
  showToUser?: boolean;
  socialDataFetched?: boolean;
  symbol?: string;
  tag?: string;
  website?: TokenlistWebsite;
}

export interface ApiMultichainTokenDetailsOutput {
  tokens?: ApiMultichainTokenDetails[];
}

export interface ApiMultichainTokenListOutput {
  tokens?: Record<string, TokenlistToken[]>;
}

export interface ApiMultichainTotalBalanceItem {
  address?: string;
  chain?: string;
  chainID?: number;
  percentage?: number;
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface ApiMultichainTotalBalanceSummary {
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface ApiMultichainTotalBalancesData {
  balances?: ApiMultichainTotalBalanceItem[];
  summary?: ApiMultichainTotalBalanceSummary;
}

export interface ApiMultichainTotalBalancesOutput {
  data?: ApiMultichainTotalBalancesData;
  timestamp?: number;
}

export interface ApiMultichainTxhistoryContractInteraction {
  contractName?: string;
  methodName?: string;
}

export interface ApiMultichainTxhistoryGetHistoryOutput {
  data?: ApiMultichainTxhistoryHistoryRecord[];
  timestamp?: number;
}

export interface ApiMultichainTxhistoryHistoryRecord {
  blockNumber?: number;
  blockTime?: number;
  chain?: MservicesChainConfig;
  contractInteraction?: ApiMultichainTxhistoryContractInteraction;
  from?: string;
  gas?: number;
  gasPrice?: string;
  gasUsed?: number;
  historicalNativeTokenPrice?: number;
  inputData?: string;
  message?: string;
  messageTheme?: string;
  nativeTokenPrice?: number;
  status?: string;
  to?: string;
  tokenApproval?: ApiMultichainTxhistoryTokenApproval;
  tokenTransfers?: ApiMultichainTxhistoryTokenTransfer[];
  txHash?: string;
  value?: string;
  walletAddress?: string;
}

export interface ApiMultichainTxhistoryTokenApproval {
  amount?: string;
  spenderAddress?: string;
  spenderName?: string;
  token?: MservicesToken;
}

export interface ApiMultichainTxhistoryTokenTransfer {
  amount?: string;
  currentPrice?: number;
  historicalPrice?: number;
  historicalValueInUsd?: number;
  otherAddress?: string;
  otherName?: string;
  token?: MservicesToken;
  tokenId?: string;
  tokenType?: string;
  valueInUsd?: number;
}

export interface ApiSolanaAllRatesOutput {
  rates?: ApiSolanaRate[];
  timestamp?: number;
}

export interface ApiSolanaAssetsOutput {
  assets?: MktAsset[];
  timestamp?: number;
}

export interface ApiSolanaBalancesOutput {
  balances?: AddressSPLTokenBalance[];
  timestamp?: number;
}

export interface ApiSolanaBuildTxOutputV1 {
  /**
   * From  string   `json:"from"`
   * To    string   `json:"to"`
   */
  data?: string[];
  timestamp?: number;
}

export interface ApiSolanaBuildTxOutputV2 {
  /**
   * From  string   `json:"from"`
   * To    string   `json:"to"`
   */
  data?: JupiterSwapTxData[];
  timestamp?: number;
}

export interface ApiSolanaCommonBaseOutput {
  timestamp?: number;
  tokens?: TokenToken[];
}

export interface ApiSolanaEligibleOutput {
  result?: boolean;
  timestamp?: number;
}

export interface ApiSolanaListNotificationOutput {
  /** @example 0 */
  nextBatchId?: string;
  notifications?: NotificationNotification[];
  timestamp?: number;
}

export interface ApiSolanaNftBalancesOutput {
  balances?: AddressCollectible[];
  timestamp?: number;
}

export interface ApiSolanaNftDetailOutput {
  detail?: AddressNftItem;
  timestamp?: number;
}

export interface ApiSolanaPriceSeriesOutput {
  marketCaps?: number[][];
  prices?: number[][];
  timestamp?: number;
  volumes?: number[][];
}

export interface ApiSolanaRate {
  amount?: string;
  networkFee?: JupiterNetworkFee;
  platform?: string;
  platformIcon?: string;
  platformShort?: string;
  platformsLogo?: Record<string, string>;
  priceImpact?: string;
  rate?: string;
  swaps?: ApiSolanaSwapsRate[][];
  tokens?: Record<string, TokenSPLToken>;
  tradePath?: string[];
}

export interface ApiSolanaSwapsRate {
  amountOut?: string;
  exchange?: string;
  extra?: {
    tokenInIndex?: number;
    tokenOutIndex?: number;
    underlying?: boolean;
    vault?: string;
  };
  limitReturnAmount?: string;
  lpFee?: JupiterFee;
  notEnoughLiquidity?: boolean;
  platformFee?: JupiterFee;
  pool?: string;
  poolLength?: number;
  poolType?: string;
  priceImpactPct?: string;
  swapAmount?: string;
  tokenIn?: string;
  tokenOut?: string;
}

export interface ApiSolanaTokenListOutput {
  timestamp?: number;
  tokens?: TokenSPLToken[];
}

export interface ApiSolanaTransactionOutput {
  timestamp?: number;
  transactions?: AddressSolTransaction[];
}

export interface ApprovalApprovalData {
  approvals?: ApprovalWrapApprovalInfo[];
  atRisk?: Record<string, number>;
}

export interface ApprovalWrapApprovalInfo {
  amount?: string;
  blockNumber?: number;
  chainId?: number;
  decimals?: number;
  lastUpdateTimestamp?: string;
  lastUpdateTxHash?: string;
  logo?: string;
  name?: string;
  ownerAddress?: string;
  spenderAddress?: string;
  spenderName?: string;
  symbol?: string;
  tag?: string;
  tokenAddress?: string;
}

export type BigFloat = object;

export interface ConfigsNetwork {
  logo?: string;
  name?: string;
}

export interface CrosschainChainInfo {
  data?: CrosschainTokenAddressResponse[];
}

export interface CrosschainCrosschainTxStatus {
  crosschainError?: string;
  crosschainStatus?: string;
  error?: string;
  from?: CrosschainTxStatus;
  logo?: string;
  msg?: string;
  timestamp?: number;
  to?: CrosschainTxStatus;
  type?: string;
}

export interface CrosschainOnchainToken {
  anyToken?: CrosschainTokenProperty;
  bigValueThreshold?: string;
  maximumSwap?: string;
  maximumSwapFee?: string;
  minimumSwap?: string;
  minimumSwapFee?: string;
  swapFeeRatePerMillion?: number;
  underlying?: CrosschainTokenProperty;
}

export interface CrosschainTokenAddressResponse {
  address?: string;
  anyToken?: CrosschainTokenProperty;
  destChains?: Record<string, CrosschainOnchainToken>;
  logoUrl?: string;
  router?: string;
  tokenid?: string;
  underlying?: CrosschainTokenProperty;
}

export interface CrosschainTokenLiquidityInfo {
  anyToken?: string;
  decimals?: number;
  isUnlimited?: boolean;
  lastSync?: string;
  liquidity?: string;
  logoUrl?: string;
  name?: string;
  symbol?: string;
}

export interface CrosschainTokenProperty {
  address?: string;
  decimals?: number;
  name?: string;
  symbol?: string;
}

export interface CrosschainTxStatus {
  address?: string;
  amount?: string;
  chainId?: string;
  chainName?: string;
  decimals?: number;
  token?: string;
  tx?: string;
  txStatus?: string;
}

export interface EarningBalance {
  balance?: string;
  balancePriceUsd?: number;
}

export interface EarningBalanceItem {
  address?: string;
  balance?: string;
  chainId?: number;
  decimals?: number;
  logo?: string;
  name?: string;
  priceUsd?: number;
  symbol?: string;
}

export interface EarningBalancesResponse {
  balances?: EarningBalanceItem[];
}

export interface EarningChain {
  id?: number;
  logo?: string;
  name?: string;
}

export interface EarningEarnOptionStatus {
  chainId?: number;
  platform?: string;
  status?: string;
  status_detail?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  type?: string;
}

export interface EarningEarningBalanceItem {
  apy?: number;
  chainId?: number;
  platform?: EarningPlatform;
  ratio?: string;
  rewardApy?: number;
  stakingToken?: EarningTokenInfo;
  status?: {
    detail?: string;
    value?: string;
  };
  toUnderlyingToken?: EarningTokenInfo;
  underlyingUsd?: number;
}

export interface EarningEarningBalancesResponse {
  earningBalances?: EarningEarningBalanceItem[];
}

export interface EarningEarningRewardDetail {
  chain?: EarningChain;
  rewardTokens?: EarningRewardToken[];
}

export interface EarningExtraData {
  nftId?: string;
  status?: string;
}

export interface EarningGetPendingRewardsResponse {
  earningRewards?: EarningEarningRewardDetail[];
  platform?: EarningPlatformInfo;
}

export interface EarningPendingUnstake {
  address?: string;
  balance?: string;
  chainId?: number;
  decimals?: number;
  extraData?: EarningExtraData;
  logo?: string;
  name?: string;
  platform?: EarningPlatform;
  priceUsd?: number;
  symbol?: string;
}

export interface EarningPendingUnstakesResponse {
  pendingUnstakes?: EarningPendingUnstake[];
}

export interface EarningPlatform {
  desc?: string;
  logo?: string;
  name?: string;
  tvl?: number;
  type?: string;
}

export interface EarningPlatformInfo {
  description?: string;
  earningType?: string;
  logo?: string;
  name?: string;
}

export interface EarningRewardToken {
  pendingReward?: EarningBalance;
  tokenInfo?: EarningTokenInfoReward;
}

export interface EarningTokenInfo {
  address?: string;
  balance?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
}

export interface EarningTokenInfoReward {
  address?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
}

export interface GithubComKyberSwapKrystalApiApiAllRatesOutput {
  rates?: GithubComKyberSwapKrystalApiApiRate[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiApprovalOutput {
  data?: ApprovalApprovalData;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiAssetsOutput {
  assets?: MktAsset[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiBalanceOutput {
  result?: GithubComKyberSwapKrystalApiApiLendingAccountInfo[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiBalancesOutput {
  balances?: AddressTokenBalance[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiBannersOutput {
  banners?: Record<string, MktBanner>;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiBuildClaimRewardsTxInput {
  chainId: number;
  from: string;
  platform: string;
}

export interface GithubComKyberSwapKrystalApiApiBuildEarningClaimTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount?: string;
  userAddress: string;
}

export interface GithubComKyberSwapKrystalApiApiBuildMultisendTxInput {
  /** @example 0xE2930a63cCCbfF754e558645cD37d86636EFC1D8 */
  senderAddress: string;
  sends?: GithubComKyberSwapKrystalApiApiSend[];
}

export interface GithubComKyberSwapKrystalApiApiBuildStakeTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount: string;
  userAddress: string;
}

export interface GithubComKyberSwapKrystalApiApiBuildTxOutput {
  timestamp?: number;
  txObject?: GithubComKyberSwapKrystalApiApiTxObject;
  usedDefaultGas?: boolean;
}

export interface GithubComKyberSwapKrystalApiApiBuildUnstakeTxInput {
  chainID: number;
  earningType: string;
  extraData?: {
    ankr?: {
      useTokenC?: boolean;
    };
    lido?: {
      nftTokenID?: string;
    };
  };
  platform: string;
  tokenAddress: string;
  tokenAmount: string;
  userAddress: string;
}

export interface GithubComKyberSwapKrystalApiApiBuyCryptoOutput {
  eternalRedirectUrl?: string;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiCampaignOutput {
  bannerUrl?: string;
  chainID?: number;
  description?: string;
  expired?: number;
  logoUrl?: string;
  network?: string;
  title?: string;
}

export interface GithubComKyberSwapKrystalApiApiChainInfo {
  id?: number;
  logo?: string;
  name?: string;
}

export interface GithubComKyberSwapKrystalApiApiClaimCodeInput {
  address: string;
  code: string;
}

export interface GithubComKyberSwapKrystalApiApiClaimCodeOutput {
  message?: string;
  success?: boolean;
}

export interface GithubComKyberSwapKrystalApiApiClaimOutput {
  claimTx?: GithubComKyberSwapKrystalApiApiTxObject;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiCodeOutput {
  campaign?: GithubComKyberSwapKrystalApiApiCampaignOutput;
  claimTx?: string;
  code?: string;
  reward?: string;
  status?: string;
  txnStatus?: string;
}

export interface GithubComKyberSwapKrystalApiApiCommonBaseOutput {
  timestamp?: number;
  tokens?: TokenToken[];
}

export interface GithubComKyberSwapKrystalApiApiCrypto {
  cryptoCurrency?: string;
  cryptoLogo?: string;
  fiatCurrency?: string;
  fiatLogo?: string;
  fiatName?: string;
  maxLimit?: number;
  minLimit?: number;
  networks?: ConfigsNetwork[];
  quotation?: number;
}

export interface GithubComKyberSwapKrystalApiApiCryptosOutput {
  data?: GithubComKyberSwapKrystalApiApiCrypto[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiDistributionBalance {
  address?: string;
  addressStr?: string;
  current?: string;
  /** TODO: Legacy supports. Should be removed ASAP */
  decimal?: number;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
  unclaimed?: string;
}

export interface GithubComKyberSwapKrystalApiApiDistributionBalanceOutput {
  balance?: GithubComKyberSwapKrystalApiApiDistributionBalance;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiEarningOption {
  apy?: number;
  chain?: GithubComKyberSwapKrystalApiApiChainInfo;
  platforms?: GithubComKyberSwapKrystalApiApiPlatform[];
  token?: TokenToken;
  tvl?: number;
}

export interface GithubComKyberSwapKrystalApiApiEarningToken {
  address?: string;
  addressStr?: string;
  decimals?: number;
  desc?: string;
  exchangeRate?: string;
  logo?: string;
  name?: string;
  requireApprove?: boolean;
  symbol?: string;
  tag?: string;
}

export interface GithubComKyberSwapKrystalApiApiEarningValidation {
  minStakeAmount?: number;
  minUnstakeAmount?: number;
  stakeInterval?: number;
}

export interface GithubComKyberSwapKrystalApiApiEligibleOutput {
  result?: boolean;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiExpectedRateOutput {
  amount?: string;
  priceImpact?: number;
  rate?: string;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiGasPrice {
  default?: string;
  fast?: string;
  low?: string;
  standard?: string;
}

export interface GithubComKyberSwapKrystalApiApiGasPriceOutput {
  basePrice?: string;
  gasPrice?: GithubComKyberSwapKrystalApiApiGasPrice;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiGetFlagOutput {
  address?: string;
  flags?: Record<string, boolean>;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiLendingAccountInfo {
  balances?: GithubComKyberSwapKrystalApiApiTokenBalanceInfo[];
  name?: string;
}

export interface GithubComKyberSwapKrystalApiApiLendingOverviewOutput {
  result?: GithubComKyberSwapKrystalApiApiLendingTokenInfo[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiLendingTokenInfo {
  address?: string;
  addressStr?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  overview?: GithubComKyberSwapKrystalApiApiTokenRateInfo[];
  symbol?: string;
  tag?: string;
}

export interface GithubComKyberSwapKrystalApiApiListNotificationOutput {
  /** @example 0 */
  nextBatchId?: string;
  notifications?: NotificationNotification[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiListOrdersOutput {
  data?: OnrampFiatOrder[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiListTokenDetailsOutput {
  result?: GithubComKyberSwapKrystalApiApiTokenDetails[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMarketOverviewOutput {
  data?: MarketEvmOverviewData[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiNftBalancesOutput {
  balances?: AddressCollectible[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiNftDetailOutput {
  detail?: AddressNftItem;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiOptionDetailOutput {
  apy?: number;
  chain?: GithubComKyberSwapKrystalApiApiChainInfo;
  /** APY float64 */
  earningTokens?: GithubComKyberSwapKrystalApiApiEarningToken[];
  platform?: GithubComKyberSwapKrystalApiApiPlatform;
  poolAddress?: string;
  requireApprove?: boolean;
  rewardAPY?: number;
  token?: TokenToken;
  validation?: GithubComKyberSwapKrystalApiApiEarningValidation;
  wrap?: {
    isWrappable?: boolean;
    wrapAddress?: string;
  };
}

export interface GithubComKyberSwapKrystalApiApiPlatform {
  apy?: number;
  desc?: string;
  logo?: string;
  name?: string;
  rewardAPY?: number;
  status?: GithubComKyberSwapKrystalApiApiStatus;
  tvl?: number;
  type?: string;
}

export interface GithubComKyberSwapKrystalApiApiPlatformsOutput {
  platforms?: string[];
}

export interface GithubComKyberSwapKrystalApiApiPoolBalancesOutput {
  balances?: AddressPoolBalance[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiPriceSeriesOutput {
  marketCaps?: number[][];
  prices?: number[][];
  timestamp?: number;
  volumes?: number[][];
}

export interface GithubComKyberSwapKrystalApiApiPromotionOutput {
  codes?: GithubComKyberSwapKrystalApiApiCodeOutput[];
}

export interface GithubComKyberSwapKrystalApiApiRate {
  amount?: string;
  estGasConsumed?: number;
  estimatedGas?: number;
  hint?: string;
  platform?: string;
  platformIcon?: string;
  platformShort?: string;
  platformsLogo?: Record<string, string>;
  priceImpact?: number;
  rate?: string;
  swaps?: InputmakerKyberswapSwapItem[][];
  tokens?: Record<string, TokenToken>;
  tradePath?: string[];
}

export interface GithubComKyberSwapKrystalApiApiRatingInput {
  category: string;
  detail?: string;
  /**
   * @min 1
   * @max 5
   */
  star: number;
  txHash: string;
}

export interface GithubComKyberSwapKrystalApiApiRefPriceOutput {
  /** @example 0 */
  refPrice?: string;
  sources?: string[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiReferralCodeOutput {
  error?: string;
  referralCodes?: ReferralCode[];
}

export interface GithubComKyberSwapKrystalApiApiReferralOverviewOutput {
  error?: string;
  overview?: ReferralReferralOverview;
}

export interface GithubComKyberSwapKrystalApiApiRegisterFavoriteNftOutput {
  success?: boolean;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiRegisterReferrerOutput {
  success?: boolean;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiRewardOutput {
  claimableRewards?: RewardClaimableResp[];
  rewards?: RewardRewardResp[];
  supportedChainIDs?: number[];
}

export interface GithubComKyberSwapKrystalApiApiSearchOutput {
  data?: AdvancedsearchAdvancedData;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSend {
  /** @example 1 */
  amount: string;
  /** @example 0xE2930a63cCCbfF754e558645cD37d86636EFC1D8 */
  toAddress: string;
  /** @example 0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb */
  tokenAddress: string;
}

export interface GithubComKyberSwapKrystalApiApiStatus {
  detail?: string;
  value?: string;
}

export interface GithubComKyberSwapKrystalApiApiSubmitMessageInput {
  message?: string;
  theme?: string;
  txHash?: string;
}

export interface GithubComKyberSwapKrystalApiApiSubmitMessageOutput {
  status?: string;
}

export interface GithubComKyberSwapKrystalApiApiSupportedChainOutput {
  id?: number;
  name?: string;
}

export interface GithubComKyberSwapKrystalApiApiTokenBalanceInfo {
  address?: string;
  addressStr?: string;
  decimals?: number;
  distributionBorrowRate?: number;
  distributionSupplyRate?: number;
  interestBearingTokenAddress?: string;
  interestBearingTokenBalance?: string;
  interestBearingTokenDecimals?: number;
  interestBearingTokenSymbol?: string;
  logo?: string;
  name?: string;
  requiresApproval?: boolean;
  stableBorrowBalance?: string;
  stableBorrowRate?: number;
  supplyBalance?: string;
  supplyRate?: number;
  symbol?: string;
  tag?: string;
  variableBorrowBalance?: string;
  variableBorrowRate?: number;
}

export interface GithubComKyberSwapKrystalApiApiTokenDetails {
  address?: string;
  cgkId?: string;
  chainId?: number;
  chainType?: string;
  decimals?: number;
  description?: string;
  id?: string;
  links?: TokenlistWebsite;
  logo?: string;
  markets?: Record<string, PricingMarketData>;
  name?: string;
  onChainDataFetched?: boolean;
  showToUser?: boolean;
  socialDataFetched?: boolean;
  symbol?: string;
  tag?: string;
  website?: TokenlistWebsite;
}

export interface GithubComKyberSwapKrystalApiApiTokenDetailsOutput {
  result?: GithubComKyberSwapKrystalApiApiTokenDetails;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiTokenListOutput {
  timestamp?: number;
  tokens?: TokenlistToken[];
}

export interface GithubComKyberSwapKrystalApiApiTokenRateInfo {
  distributionBorrowRate?: number;
  distributionSupplyRate?: number;
  liquidity?: string;
  name?: string;
  stableBorrowRate?: number;
  supplyRate?: number;
  totalSupply?: string;
  variableBorrowRate?: number;
}

export interface GithubComKyberSwapKrystalApiApiTotalBalanceItem {
  address?: string;
  chain?: string;
  chainID?: number;
  percentage?: number;
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface GithubComKyberSwapKrystalApiApiTotalBalanceSummary {
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface GithubComKyberSwapKrystalApiApiTotalBalancesData {
  balances?: GithubComKyberSwapKrystalApiApiTotalBalanceItem[];
  summary?: GithubComKyberSwapKrystalApiApiTotalBalanceSummary;
}

export interface GithubComKyberSwapKrystalApiApiTotalBalancesOutput {
  data?: GithubComKyberSwapKrystalApiApiTotalBalancesData;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiTrackingOutput {
  message?: string;
  success?: boolean;
}

export interface GithubComKyberSwapKrystalApiApiTransactionOutput {
  timestamp?: number;
  transactions?: AddressTransaction[];
}

export interface GithubComKyberSwapKrystalApiApiTransferReceiptInput {
  txData?: string;
}

export interface GithubComKyberSwapKrystalApiApiTransferReceiptOutPut {
  amount?: string;
  chainId?: number;
  containsMsg?: boolean;
  from?: string;
  message?: string;
  theme?: string;
  time?: number;
  to?: string;
  token?: TokenToken;
  txHash?: number[];
}

export interface GithubComKyberSwapKrystalApiApiTxObject {
  data?: string;
  estGasConsumed?: string;
  from?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: string;
  to?: string;
  value?: string;
}

export interface GithubComKyberSwapKrystalApiApiUpdateEarningOptionInput {
  chainId?: number;
  platform?: string;
  status?: string;
  statusDetail?: string;
  token?: string;
  type?: string;
}

export interface GithubComKyberSwapKrystalApiApiWalletInput {
  device_id: string;
  triggered: string;
  wallet_address: string;
}

export interface GithubComKyberSwapKrystalApiApiWithdrawableAmountOutput {
  amount?: string;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiReferralOverviewOutput {
  bonusRatio?: number;
  bonusVol?: number;
  codeStats?: Record<string, ReferralAccountReferralCodeStats>;
  error?: string;
  nextRewardAmount?: number;
  rewardAmount?: number;
  rewardToken?: TokenToken;
  totalVol?: number;
  volForNextReward?: number;
}

export interface GithubComKyberSwapKrystalApiApiReferralTiersOutput {
  tiers?: RewardRewardTier[];
}

export interface GithubComKyberSwapKrystalApiApiAdminCreateTokenOutput {
  status?: string;
}

export interface GithubComKyberSwapKrystalApiApiAdminDeleteTokenOutput {
  status?: string;
}

export interface GithubComKyberSwapKrystalApiApiAdminTokenInfoData {
  address?: string;
  cgkId?: string;
  chainId?: number;
  decimals?: number;
  id?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface GithubComKyberSwapKrystalApiApiAdminUpdateTokenOutput {
  status?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainBalanceByChain {
  balances?: ApiMultichainTokenBalanceWithQuote[];
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
  error?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainDistributionBalanceWithQuote {
  address?: string;
  addressStr?: string;
  current?: string;
  currentQuote?: Record<string, GithubComKyberSwapKrystalApiApiMultichainQuote>;
  decimal?: number;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
  unclaimed?: string;
  unclaimedQuote?: Record<
    string,
    GithubComKyberSwapKrystalApiApiMultichainQuote
  >;
}

export interface GithubComKyberSwapKrystalApiApiMultichainDistributionLendingItem {
  balances?: GithubComKyberSwapKrystalApiApiMultichainDistributionBalanceWithQuote[];
  chainID?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainDistributionLendingOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainDistributionLendingItem[];
}

export interface GithubComKyberSwapKrystalApiApiMultichainEnrichedLpData {
  lpPoolData?: GithubComKyberSwapKrystalApiApiMultichainEnrichedLpPoolData;
  lpPositionData?: GithubComKyberSwapKrystalApiApiMultichainEnrichedLpPositionData;
}

export interface GithubComKyberSwapKrystalApiApiMultichainEnrichedLpPoolData {
  fee?: number;
  poolAddress?: string;
  token0?: TokenutilToken;
  token1?: TokenutilToken;
}

export interface GithubComKyberSwapKrystalApiApiMultichainEnrichedLpPositionData {
  avgConvertPrice?: BigFloat;
  closedBlockTime?: number;
  currentPrice?: number;
  currentToken0Amount?: string;
  currentToken0Value?: number;
  currentToken1Amount?: string;
  currentToken1Value?: number;
  depositedTime?: number;
  impermanentLoss?: number;
  isCovertFromToken0?: boolean;
  maxPrice?: number;
  minPrice?: number;
  nfpmAddress?: string;
  pnl?: number;
  status?: string;
  tokenId?: string;
  totalFeeEarned0?: string;
  totalFeeEarned0LastWithdraw?: string;
  totalFeeEarned0LastWithdrawUsd?: number;
  totalFeeEarned0Usd?: number;
  totalFeeEarned1?: string;
  totalFeeEarned1LastWithdraw?: string;
  totalFeeEarned1LastWithdrawUsd?: number;
  totalFeeEarned1Usd?: number;
  totalToken0Amount?: string;
  totalToken0Value?: number;
  totalToken1Amount?: string;
  totalToken1Value?: number;
  yesterdayEarning?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainLendingAccountInfo {
  balances?: GithubComKyberSwapKrystalApiApiMultichainLendingBalanceWithQuote[];
  name?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainLendingBalanceWithQuote {
  address?: string;
  addressStr?: string;
  decimals?: number;
  distributionBorrowRate?: number;
  distributionSupplyRate?: number;
  interestBearingTokenAddress?: string;
  interestBearingTokenBalance?: string;
  interestBearingTokenDecimals?: number;
  interestBearingTokenSymbol?: string;
  logo?: string;
  name?: string;
  requiresApproval?: boolean;
  stableBorrowBalance?: string;
  stableBorrowQuotes?: Record<
    string,
    GithubComKyberSwapKrystalApiApiMultichainQuote
  >;
  stableBorrowRate?: number;
  supplyBalance?: string;
  supplyQuotes?: Record<string, GithubComKyberSwapKrystalApiApiMultichainQuote>;
  supplyRate?: number;
  symbol?: string;
  tag?: string;
  variableBorrowBalance?: string;
  variableBorrowQuotes?: Record<
    string,
    GithubComKyberSwapKrystalApiApiMultichainQuote
  >;
  variableBorrowRate?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainLendingOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainMultichainLendingItem[];
}

export interface GithubComKyberSwapKrystalApiApiMultichainListNativeWrappedTokens {
  data?: Record<
    string,
    Record<string, GithubComKyberSwapKrystalApiApiMultichainNativeWrappedToken>
  >;
}

export interface GithubComKyberSwapKrystalApiApiMultichainMultichainLendingItem {
  balances?: GithubComKyberSwapKrystalApiApiMultichainLendingAccountInfo[];
  chainID?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainNativeWrappedToken {
  nativeToken?: TokenTokenV2;
  wrappedToken?: TokenTokenV2;
}

export interface GithubComKyberSwapKrystalApiApiMultichainNftBalancesByChain {
  balances?: AddressCollectible[];
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainNftBalancesOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainNftBalancesByChain[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainNftDetail {
  collectibleAddress?: string;
  collectibleLogo?: string;
  collectibleName?: string;
  collectibleSymbol?: string;
  collectionDetail?: NftCollection;
  item?: AddressNftItem;
  nftType?: string[];
}

export interface GithubComKyberSwapKrystalApiApiMultichainNftDetailOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainNftDetail;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainQuote {
  price?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange24hPercentage?: number;
  symbol?: string;
  timestamp?: number;
  value?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainRefetchNftMetadataOutput {
  data?: NftNftWithMetadata[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainRefreshCollectionOutput {
  success?: boolean;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTokenBalanceOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainBalanceByChain[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTokenBalanceWithQuote {
  assetType?: string;
  balance?: string;
  lpData?: GithubComKyberSwapKrystalApiApiMultichainEnrichedLpData;
  quotes?: Record<string, GithubComKyberSwapKrystalApiApiMultichainQuote>;
  sparkline?: number[];
  token?: TokenutilToken;
  tokenId?: string;
  tokenType?: string;
  underlying?: GithubComKyberSwapKrystalApiApiMultichainTokenBalanceWithQuote[];
  userAddress?: string;
  web3ProjectAddress?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTokenDetails {
  address?: string;
  cgkId?: string;
  chainId?: number;
  chainType?: string;
  decimals?: number;
  description?: string;
  id?: string;
  logo?: string;
  markets?: Record<string, PricingMarketData>;
  name?: string;
  onChainDataFetched?: boolean;
  showToUser?: boolean;
  socialDataFetched?: boolean;
  symbol?: string;
  tag?: string;
  website?: TokenlistWebsite;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTokenDetailsOutput {
  tokens?: GithubComKyberSwapKrystalApiApiMultichainTokenDetails[];
}

export interface GithubComKyberSwapKrystalApiApiMultichainTokenListOutput {
  tokens?: Record<string, TokenlistToken[]>;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTotalBalanceItem {
  address?: string;
  chain?: string;
  chainID?: number;
  percentage?: number;
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTotalBalanceSummary {
  quotes?: Record<string, AddressQuote>;
  usdValue?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTotalBalancesData {
  balances?: GithubComKyberSwapKrystalApiApiMultichainTotalBalanceItem[];
  summary?: GithubComKyberSwapKrystalApiApiMultichainTotalBalanceSummary;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTotalBalancesOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainTotalBalancesData;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTxhistoryContractInteraction {
  contractName?: string;
  methodName?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTxhistoryGetHistoryOutput {
  data?: GithubComKyberSwapKrystalApiApiMultichainTxhistoryHistoryRecord[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTxhistoryHistoryRecord {
  blockNumber?: number;
  blockTime?: number;
  chain?: MservicesChainConfig;
  contractInteraction?: GithubComKyberSwapKrystalApiApiMultichainTxhistoryContractInteraction;
  from?: string;
  gas?: number;
  gasPrice?: string;
  gasUsed?: number;
  historicalNativeTokenPrice?: number;
  inputData?: string;
  message?: string;
  messageTheme?: string;
  nativeTokenPrice?: number;
  status?: string;
  to?: string;
  tokenApproval?: GithubComKyberSwapKrystalApiApiMultichainTxhistoryTokenApproval;
  tokenTransfers?: GithubComKyberSwapKrystalApiApiMultichainTxhistoryTokenTransfer[];
  txHash?: string;
  value?: string;
  walletAddress?: string;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTxhistoryTokenApproval {
  amount?: string;
  spenderAddress?: string;
  spenderName?: string;
  token?: MservicesToken;
}

export interface GithubComKyberSwapKrystalApiApiMultichainTxhistoryTokenTransfer {
  amount?: string;
  currentPrice?: number;
  historicalPrice?: number;
  historicalValueInUsd?: number;
  otherAddress?: string;
  otherName?: string;
  token?: MservicesToken;
  tokenId?: string;
  tokenType?: string;
  valueInUsd?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaAllRatesOutput {
  rates?: GithubComKyberSwapKrystalApiApiSolanaRate[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaAssetsOutput {
  assets?: MktAsset[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaBalancesOutput {
  balances?: AddressSPLTokenBalance[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaBuildTxOutputV1 {
  /**
   * From  string   `json:"from"`
   * To    string   `json:"to"`
   */
  data?: string[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaBuildTxOutputV2 {
  /**
   * From  string   `json:"from"`
   * To    string   `json:"to"`
   */
  data?: JupiterSwapTxData[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaCommonBaseOutput {
  timestamp?: number;
  tokens?: TokenToken[];
}

export interface GithubComKyberSwapKrystalApiApiSolanaEligibleOutput {
  result?: boolean;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaListNotificationOutput {
  /** @example 0 */
  nextBatchId?: string;
  notifications?: NotificationNotification[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaNftBalancesOutput {
  balances?: AddressCollectible[];
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaNftDetailOutput {
  detail?: AddressNftItem;
  timestamp?: number;
}

export interface GithubComKyberSwapKrystalApiApiSolanaPriceSeriesOutput {
  marketCaps?: number[][];
  prices?: number[][];
  timestamp?: number;
  volumes?: number[][];
}

export interface GithubComKyberSwapKrystalApiApiSolanaRate {
  amount?: string;
  networkFee?: JupiterNetworkFee;
  platform?: string;
  platformIcon?: string;
  platformShort?: string;
  platformsLogo?: Record<string, string>;
  priceImpact?: string;
  rate?: string;
  swaps?: GithubComKyberSwapKrystalApiApiSolanaSwapsRate[][];
  tokens?: Record<string, TokenSPLToken>;
  tradePath?: string[];
}

export interface GithubComKyberSwapKrystalApiApiSolanaSwapsRate {
  amountOut?: string;
  exchange?: string;
  extra?: {
    tokenInIndex?: number;
    tokenOutIndex?: number;
    underlying?: boolean;
    vault?: string;
  };
  limitReturnAmount?: string;
  lpFee?: JupiterFee;
  notEnoughLiquidity?: boolean;
  platformFee?: JupiterFee;
  pool?: string;
  poolLength?: number;
  poolType?: string;
  priceImpactPct?: string;
  swapAmount?: string;
  tokenIn?: string;
  tokenOut?: string;
}

export interface GithubComKyberSwapKrystalApiApiSolanaTokenListOutput {
  timestamp?: number;
  tokens?: TokenSPLToken[];
}

export interface GithubComKyberSwapKrystalApiApiSolanaTransactionOutput {
  timestamp?: number;
  transactions?: AddressSolTransaction[];
}

export interface GithubComKyberSwapKrystalApiServerLoginBody {
  /** @example 0xE2930a63cCCbfF754e558645cD37d86636EFC1D8 */
  address: string;
  /** @example 95554d788f21492b2fdcf56215fadd0a907438b02d520cecbe5c5a6b0487f2bc6d1adc5550d4ff819ce9bb170c5bc5b46ccfa63ef4cd3ee9885d19dd3a48d0a61c */
  signature: string;
  /** @example 1645000556 */
  timestamp: number;
}

export interface InputmakerKyberswapSwapItem {
  amountOut?: string;
  exchange?: string;
  extra?: {
    tokenInIndex?: number;
    tokenOutIndex?: number;
    underlying?: boolean;
    vault?: string;
  };
  limitReturnAmount?: string;
  pool?: string;
  poolExtra?: any;
  poolLength?: number;
  poolType?: string;
  swapAmount?: string;
  tokenIn?: string;
  tokenOut?: string;
}

export interface JupiterFee {
  amount?: string;
  mint?: string;
  pct?: number;
}

export interface JupiterNetworkFee {
  ataDeposits?: number[];
  minimumSOLForTransaction?: number;
  openOrdersDeposits?: number[];
  signatureFee?: number;
  totalFeeAndDeposits?: number;
}

export interface JupiterSwapTxData {
  encodedData?: string;
  transactionName?: string;
}

export interface KrystalnftKrystalNft {
  createdAt?: string;
  description?: string;
  id?: number;
  image?: string;
  name?: string;
  properties?: Record<string, string>;
}

export interface MarketEvmOverviewData {
  address?: string;
  addressStr?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  quotes?: Record<string, MarketQuote>;
  sparkline?: number[];
  symbol?: string;
  tag?: string;
  usd?: number;
  usd24hChange?: number;
  usd24hChangePercentage?: number;
  usd24hVol?: number;
  usdMarketCap?: number;
}

export interface MarketQuote {
  marketCap?: number;
  price?: number;
  price24hChange?: number;
  price24hChangePercentage?: number;
  sparkline?: number[];
  symbol?: string;
  volume24h?: number;
}

export interface MktAsset {
  id?: number;
  imageUrl?: string;
  type?: number;
  url?: string;
}

export interface MktBanner {
  content?: string;
  key?: string;
}

export interface MservicesChainConfig {
  chainId?: number;
  chainLogo?: string;
  chainName?: string;
}

export interface MservicesToken {
  address?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface NftCollection {
  address?: string;
  banner?: string;
  chainId?: number;
  description?: string;
  discordUrl?: string;
  externalLink?: string;
  floorPrice?: string;
  instagram?: string;
  isVerified?: boolean;
  marketplace?: string;
  name?: string;
  slug?: string;
  thumbnail?: string;
  twitter?: string;
  updateAt?: string;
}

export interface NftMetadata {
  animationUrl?: string;
  attributes?: any;
  description?: string;
  externalUrl?: string;
  image?: string;
  name?: string;
}

export interface NftNftWithMetadata {
  address?: string;
  burn?: boolean;
  chainId?: number;
  currentPrice?: string;
  favorite?: boolean;
  lastSalePrice?: string;
  message?: string;
  metadata?: NftMetadata;
  metadataUpdateAt?: number;
  owner?: string;
  ownerUpdateAtBlock?: number;
  paymentToken?: NftPaymentToken;
  priceUpdateAt?: number;
  refetchTime?: number;
  tokenId?: string;
  tokenUrl?: string;
  type?: string;
}

export interface NftPaymentToken {
  address?: string;
  decimals?: number;
  name?: string;
  symbol?: string;
}

export interface NotificationNotification {
  content?: string;
  createdAt?: string;
  /** gorm model */
  id?: number;
  image?: string;
  link?: string;
  title?: string;
  updatedAt?: string;
}

export interface OnrampFiatOrder {
  chainSettlementFee?: number;
  createdTime?: number;
  cryptoAddress?: string;
  cryptoCurrency?: string;
  cryptoLogo?: string;
  cryptoNetwork?: string;
  errorCode?: string;
  errorReason?: string;
  executePrice?: number;
  fiatCurrency?: string;
  fiatLogo?: string;
  fiatName?: string;
  merchantOrderId?: string;
  networkLogo?: string;
  orderAmount?: number;
  requestPrice?: number;
  status?: string;
  userFee?: number;
  userWallet?: string;
}

export interface PricingMarketData {
  ath?: number;
  /** Range [0,1] => convert to range [0, 100] */
  athChangePercentage?: number;
  athDate?: number;
  atl?: number;
  /** Range [0,1] => convert to range [0, 100] */
  atlChangePercentage?: number;
  atlDate?: number;
  high24h?: number;
  low24h?: number;
  marketCap?: number;
  marketCapChange24h?: number;
  /** Range [0,1] => convert to range [0, 100] */
  marketCapChange24hPercentage?: number;
  price?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange1hPercentage?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange1yPercentage?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange200dPercentage?: number;
  priceChange24h?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange24hPercentage?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange30dPercentage?: number;
  /** Range [0,1] => convert to range [0, 100] */
  priceChange7dPercentage?: number;
  source?: string;
  sparkline?: number[];
  symbol?: string;
  volume24h?: number;
  vsCurrency?: string;
}

export interface ReferralAccountReferralCodeStats {
  ratio?: number;
  totalRefer?: number;
  vol?: number;
}

export interface ReferralReferralCodeStats {
  pendingVol?: number;
  ratio?: number;
  realizedVol?: number;
  totalRefer?: number;
}

export interface ReferralReferralOverview {
  cashbackPendingVol?: number;
  cashbackRealizedVol?: number;
  claimablePoint?: number;
  codes?: Record<string, ReferralReferralCodeStats>;
  maxTier?: number;
  minTier?: number;
  realizedReward?: number;
}

export interface ReferralCode {
  ratio?: number;
  referralCode?: string;
}

export interface RewardClaimableResp {
  amount?: number;
  quote?: RewardQuote;
  rewardAddress?: string;
  rewardImage?: string;
  rewardName?: string;
  rewardSymbol?: string;
  token?: RewardRewardToken;
}

export interface RewardQuote {
  rate?: number;
  symbol?: string;
  value?: number;
}

export interface RewardRewardResp {
  amount?: number;
  quote?: RewardQuote;
  rewardAddress?: string;
  rewardImage?: string;
  rewardName?: string;
  rewardSymbol?: string;
  rewardType?: string;
  source?: string;
  status?: string;
  timestamp?: number;
  token?: RewardRewardToken;
}

export interface RewardRewardTier {
  level?: number;
  reward?: number;
  volume?: number;
}

export interface RewardRewardToken {
  address?: string;
  chainId?: number;
  decimals?: number;
  id?: number;
  logo?: string;
  name?: string;
  symbol?: string;
}

export interface SearchTokenSearchOutput {
  balances?: AddressTokenBalance[];
  timestamp?: number;
}

export interface TokenSPLToken {
  address?: number[];
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface TokenToken {
  address?: string;
  addressStr?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface TokenTokenV2 {
  address?: string;
  addressStr?: string;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}

export interface TokenlistToken {
  address?: string;
  cgkId?: string;
  chainId?: number;
  chainType?: string;
  decimals?: number;
  description?: string;
  id?: string;
  logo?: string;
  name?: string;
  onChainDataFetched?: boolean;
  showToUser?: boolean;
  socialDataFetched?: boolean;
  symbol?: string;
  tag?: string;
  website?: TokenlistWebsite;
}

export interface TokenlistWebsite {
  discord?: string;
  homepage?: string;
  telegram?: string;
  twitter?: string;
  twitterScreenName?: string;
}

export interface TokenutilToken {
  address?: AddressutilAddress;
  decimals?: number;
  logo?: string;
  name?: string;
  symbol?: string;
  tag?: string;
}
