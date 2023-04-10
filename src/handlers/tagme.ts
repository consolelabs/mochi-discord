import community from "adapters/community"
import {
  ButtonInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import client from "index"
import { logger } from "logger"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

class Tagme {
  private async notify(
    user: User,
    guildId: string,
    msgURL: string,
    tagger: GuildMember,
    type: "username" | "role",
    description = ""
  ) {
    if (!guildId) return
    const { ok, log, error, data } = await community.getTagme({
      userId: user.id,
      guildId,
    })

    if (!ok) {
      // we don't want to throw and restart bot
      logger.warn(
        `[Tagme] get config failed for user "${user.id}", log: ${log}, error: ${error}`
      )
      return
    }

    if (
      (type === "username" && !data.mention_username) ||
      (type === "role" && !data.mention_role)
    )
      return
    user
      .send({
        embeds: [
          composeEmbedMessage(null, {
            title: `${tagger.nickname ?? tagger.displayName} _mentioned ${
              type === "role" ? "your role" : "you"
            }_ in ${tagger.guild.name}`,
            description,
            thumbnail: tagger.guild.iconURL(),
            color: msgColors.ACTIVITY,
          }),
        ],
        components: [
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel("Go to message")
              .setStyle("LINK")
              .setURL(msgURL),
            new MessageButton()
              .setStyle("SECONDARY")
              .setCustomId(`unsubscribe-tagme_${user.id}_${guildId}`)
              .setEmoji(getEmoji("X"))
              .setLabel("Unsubscribe from this guild")
          ),
        ],
      })
      .catch((e) => {
        logger.warn(`[Tagme] send DM failed for user "${user.id}", error: ${e}`)
      })
  }

  async unsubscribe(i: ButtonInteraction) {
    await i.deferUpdate()
    const [, userId, guildId] = i.customId.split("_")
    const { ok, log, error } = await community.unsubscribeTagme({
      userId,
      guildId,
    })
    if (!ok) {
      logger.warn(
        `[Tagme] unsubscribe failed for user: "${userId}", log: ${log}, error: ${error}`
      )
    }

    const gotoMessageBtn = i.message.components?.[0].components[0]

    i.editReply({
      components: [
        new MessageActionRow().addComponents(
          ...(gotoMessageBtn ? [gotoMessageBtn] : []),
          new MessageButton()
            .setStyle("SECONDARY")
            .setLabel("Unsubscribed")
            .setCustomId("unsubscribed")
            .setDisabled(true)
        ),
      ],
    })
  }

  async handle(msg: Message) {
    const { member, mentions, cleanContent } = msg
    if (!member || member.user.id === client.user?.id) return

    mentions.users.forEach((user) => {
      this.notify(
        user,
        msg.guild?.id ?? "",
        msg.url,
        member,
        "username",
        cleanContent
      )
    })

    mentions.roles.forEach((role) => {
      role.members.forEach((member) => {
        this.notify(
          member.user,
          msg.guild?.id ?? "",
          msg.url,
          member,
          "role",
          cleanContent
        )
      })
    })
  }
}

export default new Tagme()
