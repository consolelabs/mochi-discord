import { composeEmbedMessage } from "ui/discord/embed"
import chotot from "adapters/chotot"
import { paginationButtons } from "utils/router"
import { InternalError } from "errors"
import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  SelectMenuInteraction,
} from "discord.js"
import qs from "query-string"
import { msgColors } from "utils/common"

const PAGE_SIZE = 10

type ChoTotAds = {
  subject: string
  body: string
  price_string: string
  date: string
  list_id: number
  image: string
  account_name: string
  area: string
  area_name: string
  region: string
  region_name: string
  ward_name: string
  condition_ad_name?: string
}

export async function renderAdDetail(i: SelectMenuInteraction) {
  let data: ChoTotAds | null = null
  const [listId] = i.values
  const embed = composeEmbedMessage(null, {
    title: `Chotot Ad not found`,
    color: msgColors.PINK,
    description: `Can't get ad detail id ${listId}`,
  })
  const res = await chotot.getAdDetail(listId)

  if (res.ok && res.ads.length === 1) {
    data = res.ads[0] as ChoTotAds
    const {
      subject,
      body,
      price_string,
      date,
      image,
      account_name,
      area_name,
      region_name,
      ward_name,
      condition_ad_name,
    } = data
    embed.setTitle(subject)
    const description = [
      condition_ad_name ? `**Condition**: ${condition_ad_name}` : "",
      `**Price**: ${price_string}`,
      `**Publish Date**: ${date}`,
      `**Seller**: ${account_name}`,
      `**Address**: ${[ward_name, area_name, region_name].join(", ")}`,
      body,
      `[Open Ad](https://www.chotot.com/${listId}.htm)`,
    ]
      .filter((i) => i.length > 0)
      .join("\n")
    embed.setDescription(description)
    embed.setImage(image)

    return {
      // update global state to use in other function
      context: {
        listId,
      },
      msgOpts: {
        embeds: [embed],
        components: [],
      },
    }
  }

  return {
    msgOpts: {
      embeds: [embed],
      components: [],
    },
  }
}

export async function renderListAds(
  i: CommandInteraction | ButtonInteraction,
  queryString: string,
  page = 1
) {
  const queryObj = qs.parse(queryString)
  const searchTerm = queryObj.query_term || queryString

  const res = await chotot.getListItems(queryString, page, PAGE_SIZE)
  if (!res.ok) {
    throw new InternalError({
      msgOrInteraction: i,
      title: "Cannot get ChoTot items",
      description: res.error,
    })
  }
  // Empty result
  if (res.ads.length === 0) {
    return {
      context: {
        page,
        queryString,
      },
      msgOpts: {
        embeds: [
          composeEmbedMessage(null, {
            title: `Results for \`${searchTerm}\``,
            description: `Can't find any results for \`${searchTerm}\``,
          }),
        ],
        components: [],
      },
    }
  }

  const totalPage = Math.ceil(res.total / PAGE_SIZE)

  const embed = composeEmbedMessage(null, {
    title: `Results for \`${searchTerm}\``,
    description: `Page **${page}**/${totalPage}`,
  })

  embed.fields = res.ads.map(
    (
      { subject, price_string, date, list_id, condition_ad_name }: ChoTotAds,
      i
    ) => {
      const num = (page - 1) * PAGE_SIZE + i + 1

      const postDetail = [
        `**Price:** ${price_string}${
          condition_ad_name ? ` - **${condition_ad_name}**` : ""
        }`,
        `**Publish date:** ${date}`,
        `[Open Ad](https://www.chotot.com/${list_id}.htm)`,
      ]
        .filter((i) => i.length > 0)
        .join("\n")

      return {
        name: `${num}. ${subject}`,
        value: postDetail,
        inline: false,
      }
    }
  )

  return {
    context: {
      page,
      queryString,
    },
    msgOpts: {
      embeds: [embed],
      components: [
        new MessageActionRow().addComponents(
          new MessageSelectMenu()
            .setPlaceholder(`View ad detail`)
            .setCustomId("view_chotot_detail")
            .addOptions(
              res.ads.map(({ subject, list_id }: ChoTotAds, i) => ({
                label: `${(page - 1) * PAGE_SIZE + i + 1}. ${subject}`,
                value: list_id.toString(),
              }))
            )
        ),
        ...paginationButtons(page, totalPage),
      ],
    },
  }
}
