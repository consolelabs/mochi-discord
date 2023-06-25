import { ButtonInteraction, Message } from "discord.js"
import { resolveNamingServiceDomain } from "utils/common"
import { getProfileIdByDiscord } from "utils/profile"
import { renderInvestHome } from "commands/invest/index/processor"
import { balanceEmbedProps, getBalances } from "../index/processor"
import { machineConfig } from "../index/slash"
import { route } from "utils/router"

export enum BalanceType {
  Offchain = 1,
  Onchain,
  Cex,
}

export enum BalanceView {
  Compact = 1,
  Expand,
}

export async function handleInvestButton(i: ButtonInteraction) {
  const discordId = i.user.id
  const profileId = await getProfileIdByDiscord(discordId)
  const resolvedAddress = (await resolveNamingServiceDomain("")) || ""

  const { addressType } =
    (await balanceEmbedProps[BalanceType.Offchain]?.(
      discordId,
      profileId,
      resolvedAddress,
      i
    )) ?? {}
  const balances = await getBalances(
    profileId,
    discordId,
    BalanceType.Offchain,
    i,
    resolvedAddress,
    addressType ?? "eth"
  )

  const availableTokens = balances.data.map(
    ({
      token: { symbol },
    }: {
      token: {
        symbol: string
      }
    }) => symbol
  )

  const { msgOpts, context } = await renderInvestHome(i, 0, availableTokens)

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context))
}
