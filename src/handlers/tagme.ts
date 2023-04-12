import community from "adapters/community"
import {
  ButtonInteraction,
  GuildMember,
  Message,
  MessageActionRow,
  MessageButton,
  User,
} from "discord.js"
import { logger } from "logger"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, msgColors } from "utils/common"

class Tagme {
  private async notify(
    user: User,
    guildId: string,
    msgURL: string,
    tagger: GuildMember,
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

    if (!data?.is_active) return

    user
      .send({
        embeds: [
          composeEmbedMessage(null, {
            title: `${
              tagger.nickname ?? tagger.displayName
            } _mentioned you_ in ${tagger.guild.name}`,
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
              .setCustomId(`tagme_unsubscribe_${user.id}_${guildId}`)
              .setEmoji(getEmoji("X"))
              .setLabel("Unsubscribe from this guild")
          ),
        ],
      })
      .catch((e) => {
        logger.warn(`[Tagme] send DM failed for user "${user.id}", error: ${e}`)
      })
  }

  async editSubscribeStatus(i: ButtonInteraction) {
    await i.deferUpdate()
    const [, action, userId, guildId] = i.customId.split("_")
    const isActive = action === "subscribe"
    const { ok, log, error } = await community.upsertTagme({
      userId,
      guildId,
      isActive,
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
            .setLabel(isActive ? "Unsubscribe from this guild" : "Subscribe")
            .setCustomId(
              `tagme_${
                isActive ? "unsubscribe" : "subscribe"
              }_${userId}_${guildId}`
            )
        ),
      ],
    })
  }

  async handle(msg: Message) {
    const { member, mentions, content } = msg
    if (!member || member.user.bot) return

    mentions.users.forEach((user) => {
      // if the user is the one being replied -> do nothing
      if (mentions.repliedUser?.id === user.id) return

      this.notify(user, msg.guild?.id ?? "", msg.url, member, content)
    })
  }
}

export default new Tagme()
