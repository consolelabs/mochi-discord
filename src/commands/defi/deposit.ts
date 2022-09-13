import { Command } from "types/common"
import { Message } from "discord.js"
import { DEPOSIT_GITBOOK, PREFIX } from "utils/constants"
import { DirectMessageNotAllowedError, UserNotFoundError } from "errors"
import Profile from "adapters/profile"
import { composeButtonLink, composeEmbedMessage } from "utils/discordEmbed"
import { defaultEmojis } from "utils/common"

async function deposit(msg: Message) {
  const guildId = msg.guildId ?? "DM"
  let user
  try {
    const res = await Profile.getUser({ discordId: msg.author.id })
    if (res.ok) {
      user = res.data
    } else {
      throw new UserNotFoundError({
        message: msg,
        guildId,
        discordId: msg.author.id,
      })
    }

    let description =
      "This is the wallet address linked with your discord account.\nPlease deposit to the below address only."
    description += "\n\n**Your deposit address**"
    description += `\n\`${user.in_discord_wallet_address}\``
    const dm = await msg.author.send({
      embeds: [
        composeEmbedMessage(msg, {
          title: `${defaultEmojis.ARROW_DOWN} **Deposit token**`,
          description,
        }),
      ],
    })

    if (msg.channel.type === "DM") return null

    return {
      messageOptions: {
        embeds: [
          composeEmbedMessage(msg, {
            description: `:information_source: Info\n<@${msg.author.id}>, your deposit address has been sent to you via a DM`,
          }),
        ],
        components: [composeButtonLink("See the DM", dm.url)],
      },
    }
  } catch (e: any) {
    if (msg.channel.type !== "DM" && e.httpStatus === 403) {
      throw new DirectMessageNotAllowedError({ message: msg })
    }
    throw e
  }
}

const command: Command = {
  id: "deposit",
  command: "deposit",
  brief: "Deposit tokens to your in-discord wallet",
  category: "Defi",
  run: deposit,
  getHelpMessage: async (msg) => ({
    embeds: [
      composeEmbedMessage(msg, {
        usage: `${PREFIX}deposit`,
        examples: `${PREFIX}deposit\n${PREFIX}dep`,
        document: DEPOSIT_GITBOOK,
      }),
    ],
  }),
  canRunWithoutAction: true,
  aliases: ["dep"],
  allowDM: true,
  colorType: "Defi",
}

export default command
