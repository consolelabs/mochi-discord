import config from "adapters/config"
import { Command } from "types/common"
import { PREFIX } from "utils/constants"
import { composeEmbedMessage } from "utils/discordEmbed"
import set from "./set"
import list from "./list"
import remove from "./remove"
import { twitter } from "utils/twitter-api"
import { Message } from "discord.js"
import { getEmoji } from "utils/common"
import { getCommandArguments } from "utils/commands"
import { logger } from "logger"

const hashtagReg = new RegExp(/#[a-z0-9_]+/gim)

function lower(ht: string) {
  return ht.toLowerCase()
}

function getTweetId(content: string) {
  return /(http|https):\/\/twitter.com\/.*\/(\d*)/gim.exec(content)[2]
}

function getHashtags(tweetContent: string) {
  const results = []
  let match
  while ((match = hashtagReg.exec(tweetContent)) !== null) {
    results.push(match[0])
  }
  return results
}

export async function handleNewTweet(msg: Message) {
  const twitterConfig = await config.getTwitterConfig(msg.guildId)
  if (twitterConfig?.channel_id !== msg.channelId) return
  const content = msg.content
  const tweetId = getTweetId(content)
  const tweet = await twitter.tweets.findTweetById(tweetId)
  if (!tweet.errors && tweet.data) {
    const hashtags = getHashtags(tweet.data.text).map(lower)
    const triggerHashtags = twitterConfig.hashtag.map(lower)
    const found = hashtags.filter((ht) => triggerHashtags.includes(ht))
    if (found.length > 0) {
      msg.react(getEmoji("approve")).catch(() => msg.react("✅"))
      logger.info(`[poe/twitter]: trigger for post ${msg.url}`)
    }
  }
}

const actions: Record<string, Command> = {
  set,
  list,
  remove,
}

const command: Command = {
  id: "twitter",
  command: "twitter",
  brief: "Configure your server's PoE through twitter",
  category: "Config",
  onlyAdministrator: true,
  run: async function (msg: Message) {
    const args = getCommandArguments(msg)
    const action = actions[args[2]]
    if (action) {
      return action.run(msg)
    } else {
      return { messageOptions: await this.getHelpMessage(msg) }
    }
  },
  getHelpMessage: async (msg) => {
    const args = getCommandArguments(msg)
    const action = actions[args[3]]
    if (action) {
      return action.getHelpMessage(msg)
    }

    return {
      embeds: [
        composeEmbedMessage(msg, {
          usage: `${PREFIX}poe twitter <action>`,
          footer: [`Type ${PREFIX}poe twitter <action> for a specific action!`],
          includeCommandsList: true,
          title: "PoE > Twitter",
          actions,
        }),
      ],
    }
  },
  actions,
  colorType: "Server",
  canRunWithoutAction: false,
}

export default command
