import { GuildIdNotFoundError, LogLevel } from "errors"
import { getCommandArguments } from "utils/commands"
import { Channel } from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { handleTip } from "./processor"
import { Message } from "discord.js"
import client from "index"
import { getEmoji, getEmojiURL, emojis } from "utils/common"
import TelegramBot from "node-telegram-bot-api"
import Twit from "twit"
import { getErrorEmbed, justifyEmbedFields } from "ui/discord/embed"
import { errors, logLevels, LogMessage } from "errors"

class Notification {
  private telegramToken: string
  private discordToken: string
  private twitterKey: string
  private twitterSecret: string
  private twitterAccessToken: string
  private twitterAccessTokenSecret: string

  constructor(
    telegramToken: string,
    discordToken: string,
    twitterKey: string,
    twitterSecret: string,
    twitterAccessToken: string,
    twitterAccessTokenSecret: string
  ) {
    this.telegramToken = telegramToken
    this.discordToken = discordToken
    this.twitterKey = twitterKey
    this.twitterSecret = twitterSecret
    this.twitterAccessToken = twitterAccessToken
    this.twitterAccessTokenSecret = twitterAccessTokenSecret
  }

  notifyTelegram(message: string): void {
    // Code to send a message to Telegram using the telegramToken goes here
  }

  notifyDiscord(message: string): void {
    // Code to send a message to Discord using the discordToken goes here
  }

  notifyTwitter(message: string): void {
    // Code to send a message to Twitter using the twitterKey, twitterSecret, twitterAccessToken, and twitterAccessTokenSecret goes here
  }
}

const run = async (msg: Message) => {
  // const args = getCommandArguments(msg)
  // validate valid guild
  // const dm = await msg.author.send({
  //   embeds: [
  //     composeEmbedMessage(null, {
  //       author: [`Deposit `, getEmojiURL(emojis.WALLET)],
  //       description: `Below is the wallet address linked to your Discord account.
  //         Please deposit to the following address only ${getEmoji(
  //           "ok1"
  //         )}.\n**Your deposit address is only valid for 7 days. Please re-check your deposit address using \`$deposit <cryptocurrency>\` before making a deposit.**\n\n**Your deposit address**\n\`\`\`\`\`\``,
  //     }),
  //   ],
  // })
  const bot = new TelegramBot(
    "6170117161:AAGHbgKnsYybON0reTYwN1hC6Tkw0aL7ywc",
    { polling: true }
  )
  // sendButtonToTelgram(bot)
  // handleInteractButton(bot)
  const T = new Twit({
    consumer_key: "J9tsZx7ahgW5M1yr6vTIIwhai",
    consumer_secret: "hNl8yt3WGwEzc02gi3FShkslMDfbj6vv7PgIDuOw8CxE7oYxp5",
    access_token: "1450025605639008257-xlOU879faJiNw4LGNO8hePwJghWMIX",
    access_token_secret: "POvvNqqkakvVg2JypJz0N9BJ4QE55qnQb9zxpjZHim8fw",
  })
  // sendDMToTwitterUser(T)
  // const embeds = alertMsg("ASSERTION", 5002, "Invalid api key")
  // const errorDetail = `{"guild":"DM","channel": "DM", "user": "trkhoi#2166", "message": "<:nekosad:900363887122186310> Unfortunately, no **ETH** contract is available at this time. Please try again later"}`
  // const embed = await logError(errors.API_KEY_NOT_FOUND, errorDetail)
  // const chan = await msg.guild!.channels.cache.get("1016561468369551370")
  // if (chan?.isText()) {
  //   chan?.send({ embeds: [embed] }).catch(() => null)
  // }
  // const userEmbed = composeEmbedMessage(null, {
  //   title: `Command error`,
  //   description: errors.API_KEY_NOT_FOUND.msg,
  // })
  // return {
  //   messageOptions: {
  //     embeds: [justifyEmbedFields(userEmbed, 1)],
  //   },
  // }

  const user2 = {
    username: "badedd",
    telegramId: "hanngo",
    twitterId: "hanngo",
    balance: [
      {
        token: "eth",
        amount: 100,
      },
      {
        token: "ftm",
        amount: 100,
      },
      {
        token: "sol",
        amount: 100,
      },
    ],
  }
  const user1 = {
    username: "trkhoi",
    telegramId: "trkhoi",
    twitterId: "trkhoi",
    balance: [
      {
        token: "eth",
        amount: 100,
      },
      {
        token: "ftm",
        amount: 100,
      },
      {
        token: "sol",
        amount: 100,
      },
    ],
    wallet: [
      {
        id: "eth",
        address: "0x123",
      },
      {
        id: "ftm",
        address: "0x123",
      },
      {
        id: "sol",
        address: "0x123",
      },
    ],
    nft: [
      {
        collection: "neko",
        amount: 3,
      },
      {
        collection: "rabby",
        amount: 3,
      },
    ],
  }

  transfer("trkhoi", "badedd", 8, "eth")
  sendTelegramMsg(bot)
  postTweetToTwitter(T)
  sendDMMsg()

  // const userEmbed = composeEmbedMessage(null, {
  //   title: `Tip success`,
  //   description: "trkhoi sent badded 9 eth",
  // })
  // return {
  //   messageOptions: {
  //     embeds: [justifyEmbedFields(userEmbed, 1)],
  //   },
  // }
}

async function transfer(
  sender: string,
  recipient: string,
  amount: number,
  token: string
) {
  // notify twitter
  // notify telegram
}
async function logError(err: LogMessage, errorObj: string) {
  const now = new Date()
  console.log(
    `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}: ${
      logLevels.ERROR.type
    }/${new Error(JSON.stringify(JSON.parse(errorObj), null, 2)).stack}`
  )

  return composeEmbedMessage(null, {
    title: `**${logLevels.ERROR.type} - ${err.id} -${err.msg} **`,
    color: logLevels.ERROR.color,
    description: `**Command:** \`$deposit eth\`\n**Guild:** \`Web3 Console\`\n**Channel:** \`playground-prod\`\n**Error Message:** ${
      errorObj
        ? `\`\`\`${errorObj}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`,
  })
}

async function logDebug(err: LogMessage, errorObj: string) {
  return composeEmbedMessage(null, {
    title: `**${logLevels.DEBUG.type} - ${err.id} -${err.msg} **`,
    color: logLevels.DEBUG.color,
    description: `**Command:** \`$deposit eth\`\n**Guild:** \`Web3 Console\`\n**Channel:** \`playground-prod\`\n**Error Message:** ${
      errorObj
        ? `\`\`\`${errorObj}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`,
  })
}

async function logINFO(err: LogMessage, errorObj: string) {
  return composeEmbedMessage(null, {
    title: `**${logLevels.INFO.type} - ${err.id} -${err.msg} **`,
    color: logLevels.INFO.color,
    description: `**Command:** \`$deposit eth\`\n**Guild:** \`Web3 Console\`\n**Channel:** \`playground-prod\`\n**Error Message:** ${
      errorObj
        ? `\`\`\`${errorObj}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`,
  })
}

async function logWARN(err: LogMessage, errorObj: string) {
  return composeEmbedMessage(null, {
    title: `**${logLevels.WARN.type} - ${err.id} -${err.msg} **`,
    color: logLevels.WARN.color,
    description: `**Command:** \`$deposit eth\`\n**Guild:** \`Web3 Console\`\n**Channel:** \`playground-prod\`\n**Error Message:** ${
      errorObj
        ? `\`\`\`${errorObj}\`\`\``
        : "Error without message, this is likely an unexpected error"
    }`,
  })
}

async function sendDMEmbed() {
  client.users.fetch("151497832853929986").then(async (user) => {
    if (user.bot) return

    user
      .createDM()
      .catch(() => null)
      .then((dm) => {
        dm?.send({
          embeds: [
            composeEmbedMessage(null, {
              title: `Welcome to Mochi Bot.`,
              color: `0xFCD3C1`,
              description: `Type \`$help\` in server or read this Instruction on [Gitbook](https://app.gitbook.com/s/nJ8qX0cEj5ph125HugiB/~/changes/SoXaDd3kMCfyXNQDOZ9f/getting-started/permission-and-prefix) to get to know all our features. Now, let us walk you through some of Mochi Bot main functions:\n
              - **Crypto management:** Managing your crypto portfolio.
              - **NFT Rarity Ranking & Volume:** Tracking and managing your favorite NFT collections.
              - **Server Administration:** Building and managing your own community on Discord (For server owners only. Want to use these features? [Install Mochi Bot to your server now!](https://getmochi.co/))
              \nRemember to use our feature, you need to place \`$\` or \`/\` in every command. Now, back to server, start with $help, and try our features!!!`,
            }),
          ],
        }).catch(() => null)
        dm?.send({
          embeds: [
            composeEmbedMessage(null, {
              description: `Testting things`,
              color: `0xFCD3C1`,
            }),
          ],
        }).catch(() => null)
      })
      .catch(() => null)
  })
}

async function sendDMMsg() {
  // client.users.fetch("971632433294348289").then(async (user) => {
  //   if (user.bot) return

  //   user
  //     .createDM()
  //     .catch(() => null)
  //     .then((dm) => {
  //       dm?.send("Welcome new member")
  //     })
  //     .catch(() => null)
  // })
  client.users.fetch("151497832853929986").then((user) => {
    user.send("trkhoi sent badded 8 eth")
  })
}

async function sendTelegramMsg(bot: TelegramBot) {
  const sendMessage = async (chatId: number, text: string) => {
    try {
      await bot.sendMessage(chatId, text)
    } catch (error) {
      console.error(error)
    }
  }

  bot.on("message", (msg) => {
    console.log(msg)
    if (msg.text === "/tip") {
      sendMessage(msg.chat.id, "trkhoi sent badded 8 eth")
    }
    // const chatId = msg.chat.id
    // sendMessage(chatId, "trkhoi sent badded 9 eth")
  })
}

async function sendTelegramEmbed() {
  const bot = new TelegramBot(
    "6170117161:AAGHbgKnsYybON0reTYwN1hC6Tkw0aL7ywc",
    { polling: true }
  )

  const embed = `
      <b>Bold Text</b>
      <i>Here 🎉 is an emoji 😃 🚀</i>
      <a href="http://www.example.com/">Link</a>
    `

  const sendEmbedMessage = async (chatId: number, embed: string) => {
    try {
      await bot.sendMessage(chatId, embed, {
        parse_mode: "HTML",
      })
    } catch (error) {
      console.error(error)
    }
  }

  bot.on("message", (msg) => {
    // console.log(msg)
    const chatId = msg.chat.id
    sendEmbedMessage(chatId, embed)
  })
}

async function sendButtonToTelgram(bot: TelegramBot) {
  // const bot = new TelegramBot(
  //   "6170117161:AAGHbgKnsYybON0reTYwN1hC6Tkw0aL7ywc",
  //   { polling: true }
  // )

  const sendButtonMessage = async (chatId: number, text: string) => {
    try {
      await bot.sendMessage(chatId, text, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Button Text 1",
                callback_data: "button_data_1",
              },
              {
                text: "Button Text 3",
                callback_data: "button_data_3",
              },
            ],
            [
              {
                text: "Button Text 2",
                callback_data: "button_data_2",
              },
            ],
          ],
        },
      })
    } catch (error) {
      console.error(error)
    }
  }

  const text = "Press the button to perform an action"
  bot.on("message", (msg) => {
    // console.log(msg)
    const chatId = msg.chat.id
    sendButtonMessage(chatId, text)
  })
}

async function handleInteractButton(bot: TelegramBot) {
  // const bot = new TelegramBot(
  //   "6170117161:AAGHbgKnsYybON0reTYwN1hC6Tkw0aL7ywc",
  //   { polling: true }
  // )

  bot.on("callback_query", async (callbackQuery) => {
    const { message, data } = callbackQuery

    switch (data) {
      case "button_data_1":
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "You pressed Button 1",
        })
        break
      case "button_data_2":
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "You pressed Button 2",
        })
        break
      case "button_data_3":
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "You pressed Button 3",
        })
        break
      case "button_data_4":
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: "You pressed Button 4",
        })
        break
      default:
        break
    }
  })
}

async function postTweetToTwitter(T: Twit) {
  const tweet = {
    status: "trkhoi sent badded 8 eth",
  }

  T.post("statuses/update", tweet, (err, data, response) => {
    if (err) {
      console.log("Error: ", err)
    } else {
      console.log("Success: ", data)
    }
  })
}

async function sendDMToTwitterUser(T: Twit) {
  // const recipientScreenName = "KenNgoTrongKho1"

  // T.get(
  //   "users/show",
  //   { screen_name: recipientScreenName },
  //   (err, data, response) => {
  //     if (err) {
  //       console.log("Error: ", err)
  //     } else {
  //       console.log("Success: ", data)
  //     }
  //   }
  // )

  const recipientScreenName = "KenNgoTrongKho1"
  const message = "Hello, this is a Direct Message from a bot"
  T.post(
    "direct_messages/events/new",
    {
      event: {
        type: "message_create",
        message_create: {
          target: {
            recipient_id: recipientScreenName,
          },
          message_data: {
            text: message,
          },
        },
      },
    },
    (err, data, response) => {
      if (err) {
        console.log("Error: ", err)
      } else {
        console.log("Success: ", data)
      }
    }
  )
}

async function alertMsg(logType: string, errorCode: number, errorMsg: string) {
  const embed = composeEmbedMessage(null, {
    title: "test",
    description: `**${logType} - ${errorCode} - ${errorMsg}**`,
  })
  console.log(embed)
  return {
    embeds: [embed],
  }
}

export default run
