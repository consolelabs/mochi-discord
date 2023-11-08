import FuzzySet from "fuzzyset"
import { getAllAliases } from "utils/commands"

import { Category, Command, SlashCommand } from "types/common"

import airdrop from "./airdrop"
import balances from "./balances"
import deposit from "./deposit"
import feedback from "./feedback/index"
import gm from "./gm"
import help from "./help/index"
import gas from "./gas"
import activity from "./activity"
import inbox from "./inbox"
import nft from "./nft"
import profile from "./profile"
import quest from "./quest"
import sales from "./sales"
import sendxp from "./sendxp"
import telegram from "./telegram"
import ticker from "./ticker"
import tip from "./tip"
import token from "./token"
import top from "./top"
import watchlist from "./watchlist"
import watchlistView from "./watchlist/view/slash"
import withdraw from "./withdraw"
import wallet from "./wallet"
import alert from "./alert"
import stats from "./stats"
import pay from "./pay"
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
import invest from "./invest"
import drop from "./drop"
import qr from "./qr"
import defaults from "./default"
import setting from "./setting"
import update from "./update"
import role from "./role"
import setup from "./setup"
import roles from "./roles"
import info from "./info"
import ecocal from "./ecocal"
import ecocalView from "./ecocal/view/slash"
import chotot from "./chotot"
import proposal from "./proposal"
import guess from "./guess"
import changelog from "./changelog"
import v from "./v"
import sync from "./sync"
import recap from "./recap"
import feed from "./feed"

export const slashCommands: Record<string, SlashCommand> = {
  setup: setup.slashCmd,
  admin: admin.slashCmd,
  feedback: feedback.slashCmd,
  ticker: ticker.slashCmd,
  help: help.slashCmd,
  top: top.slashCmd,
  //
  leaderboard: top.slashCmd,
  watchlist: watchlist.slashCmd,
  // alias
  wlv: watchlistView,
  wlc: watchlistView,
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
  withdraw: withdraw.slashCmd,
  wd: withdraw.slashCmd,
  airdrop: airdrop.slashCmd,
  sales: sales.slashCmd,
  token: token.slashCmd,
  profile: profile.slashCmd,
  deposit: deposit.slashCmd,
  dep: deposit.slashCmd,
  sendxp: sendxp.slashCmd,
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
  invest: invest.slashCmd,
  qr: qr.slashCmd,
  default: defaults.slashCmd,
  setting: setting.slashCmd,
  update: update.slashCmd,
  role: role.slashCmd,
  roles: roles.slashCmd,
  pay: pay.slashCmd,
  info: info.slashCmd,
  ecocal: ecocal.slashCmd,
  ecalw: ecocalView,
  chotot: chotot.slashCmd,
  proposal: proposal.slashCmd,
  guess: guess.slashCmd,
  changelog: changelog.slashCmd,
  v: v.slashCmd,
  sync: sync.slashCmd,
  recap: recap.slashCmd,
  feed: feed.slashCmd,
  //
  tipfeed: feed.slashCmd,
}

// text commands is being deprecated, refer to slashCommands for latest version
export const originalCommands: Record<string, Command> = {
  // profile section
  tip: tip.textCmd,
  tokens: token.textCmd,
  watchlist: watchlist.textCmd,
  gm: gm.textCmd,
  nft: nft.textCmd,
  sales: sales.textCmd,
  feedback: feedback.textCmd,
  alert: alert.textCmd,
  gas: gas.textCmd,
  proposal: proposal.textCmd,
  // config section
  stats: stats.textCmd,
  // globalxp,
  sendxp: sendxp.textCmd,

  heatmap: heatmap.textCmd,
}

export const commands = getAllAliases(originalCommands)
export const fuzzySet = FuzzySet(Object.keys(commands))
export const adminCategories: Record<Category, boolean> = {
  Profile: false,
  Defi: false,
  Community: false,
  Config: true,
  Game: false,
}
