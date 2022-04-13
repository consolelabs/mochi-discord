import {
  Message,
  MessageEmbed,
  MessageButton,
  MessageActionRow,
  MessagePayload,
  MessageOptions,
  DiscordAPIError,
  Channel,
  User,
} from "discord.js"
import { DISCORD_BOT_CHANNEL } from "../src/env"
import { verify } from "../src/commands/profile/verify"
import db from "../src/modules/db"
import { getMessage } from "./mocks"

describe("Verify Command", () => {
  let messageMock = getMessage()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("run on wrong channel", async () => {
    jest
      .spyOn(messageMock.channel, "send")
      .mockImplementationOnce(
        (options: string | MessagePayload | MessageOptions) => {
          return new Promise((resolve, reject) => {
            resolve({} as Message)
          })
        }
      )

    await verify(messageMock)

    expect(messageMock.channel.send).toHaveBeenCalledTimes(1)

    expect(messageMock.channel.send).toHaveBeenCalledWith(
      `sur! head to <#${DISCORD_BOT_CHANNEL}> to verify your address`
    )
  })

  it("fail to DM", async () => {
    messageMock.channel.id = DISCORD_BOT_CHANNEL
    messageMock.author.id = "123"
    jest
      .spyOn(messageMock.author, "send")
      .mockImplementationOnce(
        (options: string | MessagePayload | MessageOptions) => {
          return new Promise((resolve, reject) => {
            reject({ code: 50007 } as DiscordAPIError)
          })
        }
      )

    jest
      .spyOn(messageMock, "reply")
      .mockImplementationOnce(
        (options: string | MessagePayload | MessageOptions) => {
          return new Promise((resolve, reject) => {
            resolve({} as Message)
          })
        }
      )

    await verify(messageMock)

    expect(messageMock.author.send).toHaveBeenCalledTimes(1)
    expect(messageMock.reply).toHaveBeenCalledTimes(1)
    expect(messageMock.reply).toHaveBeenCalledWith(
      "I can't DM you. Make sure Allow direct message from server members is checked"
    )
  })

  it("user has already had a identity", async () => {
    messageMock.channel.id = DISCORD_BOT_CHANNEL
    messageMock.author.id = "123"
    jest
      .spyOn(messageMock.author, "send")
      .mockImplementationOnce(
        (options: string | MessagePayload | MessageOptions) => {
          return new Promise((resolve, reject) => {
            resolve({} as Message)
          })
        }
      )

    await verify(messageMock)

    expect(messageMock.author.send).toHaveBeenCalledTimes(1)
    expect(messageMock.author.send).toHaveBeenCalledWith({
      embeds: [
        new MessageEmbed()
          .setTitle("You already had a identity")
          .setThumbnail(
            "https://res.cloudinary.com/dffqzkip0/image/upload/v1634371763/neko-bot.png"
          )
          .setDescription(`0x`),
      ],
    })
  })

  it("ask user to verify identity", async () => {
    messageMock.channel.id = DISCORD_BOT_CHANNEL
    messageMock.author.id = "456"
    jest
      .spyOn(messageMock.author, "send")
      .mockImplementationOnce(
        (options: string | MessagePayload | MessageOptions) => {
          return new Promise((resolve, reject) => {
            resolve({} as Message)
          })
        }
      )

    await verify(messageMock)

    const query = await db.query(
      "select * from discord_verifications where discord_user_id = '456'"
    )
    expect(query.rowCount).toBe(1)
    expect(messageMock.author.send).toHaveBeenCalledTimes(1)
    expect(messageMock.author.send).toHaveBeenCalledWith({
      embeds: [
        new MessageEmbed()
          .setTitle("Let's setup your identity")
          .setDescription("Click the button the verify your address")
          .setThumbnail(
            "https://res.cloudinary.com/dffqzkip0/image/upload/v1634371763/neko-bot.png"
          )
          .setFooter("The link is valid for 10 minutes"),
      ],

      components: [
        new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel("Connect to Metamask")
            .setStyle("LINK")
            .setURL(`https://pod.so/verify?code=${query.rows[0].code}`)
        ),
      ],
    })
  })
})
