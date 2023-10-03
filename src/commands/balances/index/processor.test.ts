import profile from "adapters/profile"
import { CommandInteraction } from "discord.js"
import { composeEmbedMessage, justifyEmbedFields } from "ui/discord/embed"
import { chainTypes } from "utils/chain"
import { getSlashCommand } from "utils/commands"
import { emojis, getEmoji, getEmojiURL } from "utils/common"

import mockdc from "../../../../tests/mocks/discord"
import mochiPay from "../../../adapters/mochi-pay"
import { BalanceType, renderBalances } from "./processor"

jest.mock("adapters/defi")
describe("balances", () => {
  let i: CommandInteraction
  const mockTx = {
    id: "1f5b3acd-bfe8-4d15-aa65-147fe1f0f729",
    profile_id: "48036",
    other_profile_id: "1683332422424334336",
    type: "debit",
    token_id: "941f0fb1-00da-49dc-a538-5e81fc874cb4",
    amount: "1000000000000000000",
    created_at: "2023-08-07T11:10:27.398642Z",
    updated_at: "2023-08-07T11:10:27.398642Z",
    external_id: "146c96290d54",
    tx_id: 7381,
    token: {
      id: "941f0fb1-00da-49dc-a538-5e81fc874cb4",
      name: "Icy",
      symbol: "ICY",
      decimal: 18,
      chain_id: "137",
      native: false,
      address: "0x8D57d71B02d71e1e449a0E459DE40473Eb8f4a90",
      icon: "https://cdn.discordapp.com/emojis/1049620715374133288.webp?size=240&quality=lossless",
      coin_gecko_id: "icy",
      price: 0,
      chain: {
        id: "7303f2f8-b6d9-454d-aa92-880569fa5295",
        chain_id: "137",
        name: "Polygon Mainnet",
        symbol: "MATIC",
        rpc: "https://polygon.llamarpc.com",
        explorer: "https://polygonscan.com",
        icon: "https://cdn.discordapp.com/emojis/928216430535671818.png?size=240&quality=lossless",
        type: chainTypes.EVM,
      },
    },
    other_profile: null,
    profile: null,
    usd_amount: 0,
  }

  beforeEach(() => (i = mockdc.cloneCommandInteraction()))
  test("balances", async () => {
    const balResp = {
      ok: true,
      data: [
        {
          amount: 10000000000000000000,
          token: {
            name: "Panswap Cake",
            symbol: "CAKE",
            decimal: 18,
            price: 3,
          },
        },
        {
          amount: 5000000000000000000,
          token: {
            name: "Fantom",
            symbol: "FTM",
            decimal: 18,
            price: 0.5,
          },
        },
      ],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    profile.getUserWallets = jest.fn().mockResolvedValueOnce({
      mochiWallets: [],
      wallets: [],
    })
    mochiPay.getListTx = jest.fn().mockResolvedValueOnce({
      ok: true,
      data: [mockTx],
    })
    const expected = composeEmbedMessage(null, {
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `**Wallets**\n\n\n**Spot**\n<:cake:1113114867361120287>\`10 CAKE ≈  $30\`\n<:ftm:967285237686108212>\`5 FTM   ≈ $2.5\``,
    })
    justifyEmbedFields(expected, 3)
    expected.addFields({
      name: `Total (U.S dollar)`,
      value: `${getEmoji("CASH")} \`$32.5\``,
    })
    const { msgOpts } = await renderBalances(i.user.id, {
      type: BalanceType.Offchain,
      interaction: i,
      address: "",
    })
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(msgOpts.embeds?.[0].author).toStrictEqual(expected.author)
    expect(msgOpts.embeds?.[0].description).toStrictEqual(expected.description)
  })

  test("dont have balances", async () => {
    const balResp = {
      ok: true,
      data: [],
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    profile.getUserWallets = jest.fn().mockResolvedValueOnce({
      mochiWallets: [],
      wallets: [],
    })
    mochiPay.getListTx = jest.fn().mockResolvedValueOnce({
      ok: true,
      data: [mockTx],
    })
    const expected = composeEmbedMessage(null, {
      author: ["Mochi wallet", getEmojiURL(emojis.NFT2)],
      description: `${getEmoji(
        "ANIMATED_POINTING_RIGHT",
        true,
      )} You have nothing yet, use ${await getSlashCommand(
        "earn",
      )} or ${await getSlashCommand("deposit")}\n\n**Wallets**\n\n\n`,
    })
    const { msgOpts } = await renderBalances(i.user.id, {
      type: BalanceType.Offchain,
      interaction: i,
      address: "",
    })
    expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
    expect(msgOpts.embeds?.[0].author).toStrictEqual(expected.author)
    expect(msgOpts.embeds?.[0].description).toStrictEqual(expected.description)
  })

  test("balances api error", async () => {
    const balResp = {
      error: "error",
    }
    mochiPay.getBalances = jest.fn().mockResolvedValueOnce(balResp)
    try {
      await renderBalances(i.user.id, {
        type: BalanceType.Offchain,
        interaction: i,
        address: "",
      })
    } catch (e) {
      expect(mochiPay.getBalances).toHaveBeenCalledTimes(1)
      // TODO: Update later
      // expect(e).toBeInstanceOf(APIError)
    }
  })
})
