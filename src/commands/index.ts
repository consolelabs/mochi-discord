// internal
import CacheManager from "cache/node-cache"
import { SlashCommand } from "types/common"
import airdrop from "./airdrop"
import balances from "./balances"
import proposal from "./proposal"
import deposit from "./deposit"
import feedback from "./feedback/index"
import gm from "./gm"
import help from "./help/index"
import moniker from "./moniker"
import gas from "./gas"
import activity from "./activity"
import inbox from "./inbox"
import nft from "./nft"
import profile from "./profile"
import prune from "./prune"
import quest from "./quest"
import sales from "./sales"
import telegram from "./telegram"
import ticker from "./ticker"
import tip from "./tip"
import token from "./token"
import top from "./top"
import verify from "./verify"
import watchlist from "./watchlist"
import watchlistView from "./watchlist/view/slash"
import welcome from "./welcome/index"
import withdraw from "./withdraw"
import wallet from "./wallet"
import alert from "./alert"
import stats from "./stats"
import convert from "./convert"
import vault from "./vault"
import config from "./config"
import heatmap from "./heatmap"
import swap from "./swap"
import tagme from "./tagme"
import trending from "./trending"
import gainer from "./gainer"
import loser from "./loser"
import transaction from "./transaction"
import admin from "./admin"
import botManager from "./bot-manager"
import earn from "./earn"
import drop from "./drop"
import qr from "./qr"
import defaults from "./default"
import setting from "./setting"
import update from "./update"
import role from "./role"

CacheManager.init({
  ttl: 0,
  pool: "imagepool",
  checkperiod: 3600,
})

export const slashCommands: Record<string, SlashCommand> = {
  admin: admin.slashCmd,
  feedback: feedback.slashCmd,
  ticker: ticker.slashCmd,
  help: help.slashCmd,
  welcome: welcome.slashCmd,
  top: top.slashCmd,
  verify: verify.slashCmd,
  watchlist: watchlist.slashCmd,
  // alias
  wlv: watchlistView,
  wlc: watchlistView,
  prune: prune.slashCmd,
  quest: quest.slashCmd,
  gm: gm.slashCmd,
  nft: nft.slashCmd,
  //
  tip: tip.slashCmd,
  send: tip.slashCmd,
  //
  balances: balances.slashCmd,
  balance: balances.slashCmd,
  bal: balances.slashCmd,
  bals: balances.slashCmd,
  //
  proposal: proposal.slashCmd,
  moniker: moniker.slashCmd,
  withdraw: withdraw.slashCmd,
  wd: withdraw.slashCmd,
  airdrop: airdrop.slashCmd,
  sales: sales.slashCmd,
  token: token.slashCmd,
  profile: profile.slashCmd,
  deposit: deposit.slashCmd,
  dep: deposit.slashCmd,
  alert: alert.slashCmd,
  wallet: wallet.slashCmd,
  stats: stats.slashCmd,
  gas: gas.slashCmd,
  activity: activity.slashCmd,
  inbox: inbox.slashCmd,
  convert: convert.slashCmd,
  vault: vault.slashCmd,
  config: config.slashCmd,
  heatmap: heatmap.slashCmd,
  swap: swap.slashCmd,
  tagme: tagme.slashCmd,
  trending: trending.slashCmd,
  gainer: gainer.slashCmd,
  loser: loser.slashCmd,
  transaction: transaction.slashCmd,
  "bot-manager": botManager.slashCmd,
  telegram: telegram.slashCmd,
  earn: earn.slashCmd,
  drop: drop.slashCmd,
  qr: qr.slashCmd,
  default: defaults.slashCmd,
  setting: setting.slashCmd,
  update: update.slashCmd,
  role: role.slashCmd,
}
