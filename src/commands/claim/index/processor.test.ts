import defi from "adapters/defi"
import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { getEmoji, roundFloatNumber, shortenHashOrAddress } from "utils/common"
import { assertRunResult } from "../../../../tests/assertions/discord"
import { InternalError } from "errors"
import mockdc from "../../../../tests/mocks/discord"
import { DISCORD_URL } from "utils/constants"
jest.mock("adapters/defi")

describe("claim", () => {
  const msg = mockdc.cloneMessage()

  beforeEach(() => jest.clearAllMocks())

  test("claim successful with proper description", async () => {
    const args = ["claim", "1", "0xAbcAbc123"]
    const claimOnchainTransferRes = {
      ok: true,
      data: {
        amount: 1,
        symbol: "ftm",
        amount_in_usd: 0.6,
        tx_hash: "0xAbcAbcXyz",
        tx_url: "ftm.scan.com/tx_hash/0xAbcAbcXyz",
        recipient_address: "0xAbcAbc123",
      },
      log: "",
      error: "",
      status: 200,
      url: "",
    }
    const getUserOnchainTransfersRes = {
      ok: true,
      data: [],
      log: "",
      error: "",
      status: 400,
      url: "",
    }
    defi.claimOnchainTransfer = jest
      .fn()
      .mockResolvedValueOnce(claimOnchainTransferRes)
    defi.getUserOnchainTransfers = jest
      .fn()
      .mockResolvedValueOnce(getUserOnchainTransfersRes)
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    const {
      amount,
      symbol,
      amount_in_usd,
      tx_hash,
      tx_url,
      recipient_address,
    } = claimOnchainTransferRes.data
    const expectDesc = `${pointingright} **${amount} ${symbol}** (≈ $${roundFloatNumber(
      amount_in_usd,
      4
    )}) was sent to your address \`${shortenHashOrAddress(
      recipient_address
    )}\`! Check your wallet!\n${pointingright} You can claim another tip by using\n\`$claim <Claim ID> <your recipient address>\`.`
    const expectedEmbed = getSuccessEmbed({
      msg,
      title: "Succesfully claimed!",
      description: expectDesc,
    }).addFields([
      { name: "Transaction", value: `[\`${tx_hash}\`](${tx_url})` },
    ])
    const output = await processor.claim(msg, args)
    assertRunResult(output, { messageOptions: { embeds: [expectedEmbed] } })
  })

  test("claimId is not a number", async () => {
    const args = ["claim", "x", "0xAbcAbc123"]
    defi.claimOnchainTransfer = jest.fn()
    await expect(processor.claim(msg, args)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Claiming failed!",
        description: "`claim ID` must be a number",
      })
    )
    expect(defi.claimOnchainTransfer).not.toHaveBeenCalled()
  })

  test("claimOnchainTransfer response to be 404", async () => {
    const args = ["claim", "1", "0xAbcAbc123"]
    const claimOnchainTransferRes = {
      ok: false,
      data: null,
      log: "",
      error: "",
      status: 404,
      url: "",
    }
    const getUserOnchainTransfersRes = {
      ok: true,
      data: [{ id: "0x123123" }, { id: "0x123124" }],
      log: "",
      error: "",
      status: 200,
      url: "",
    }
    const pointingright = getEmoji("ANIMATED_POINTING_RIGHT", true)
    defi.claimOnchainTransfer = jest
      .fn()
      .mockResolvedValueOnce(claimOnchainTransferRes)
    defi.getUserOnchainTransfers = jest
      .fn()
      .mockResolvedValueOnce(getUserOnchainTransfersRes)
    await expect(processor.claim(msg, args)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Fail to claim tip!",
        description: [
          `${pointingright} You may enter an invalid \`claim ID\` or claimed one!`,
          `${pointingright} You can pick one of these \`claim ID\`: ${getUserOnchainTransfersRes.data
            .map((tx: any) => tx.id)
            .join(", ")}`,
          `${pointingright} You can only claim one transaction at once.`,
        ].join("\n"),
      })
    )
    expect(defi.claimOnchainTransfer).toHaveBeenCalledTimes(1)
  })

  test("balance is not enough", async () => {
    const args = ["claim", "1", "0xAbcAbc123"]
    const claimOnchainTransferRes = {
      ok: false,
      data: null,
      log: "",
      error: "",
      status: 500,
      url: "",
      originalError: "abc balance is not enough",
    }
    defi.claimOnchainTransfer = jest
      .fn()
      .mockResolvedValueOnce(claimOnchainTransferRes)
    defi.getUserOnchainTransfers = jest.fn()
    await expect(processor.claim(msg, args)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Failed to claim tip!",
        description: `Mochi wallet's balance is insufficient to proceed this transaction.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You can contact our developer at suggestion forum in [Mochi Discord](${DISCORD_URL})!\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You can try to claim other tips and get back to this one later! ${getEmoji(
          "SOON"
        )}\nSorry for this inconvenience ${getEmoji("NEKOSAD")}`,
      })
    )
    expect(defi.getUserOnchainTransfers).not.toHaveBeenCalled()
  })

  test("insufficient fund", async () => {
    const args = ["claim", "1", "0xAbcAbc123"]
    const claimOnchainTransferRes = {
      ok: false,
      data: null,
      log: "",
      error: "",
      status: 500,
      url: "",
      originalError: "abc insufficient fund",
    }
    defi.claimOnchainTransfer = jest
      .fn()
      .mockResolvedValueOnce(claimOnchainTransferRes)
    defi.getUserOnchainTransfers = jest.fn()
    await expect(processor.claim(msg, args)).rejects.toThrow(
      new InternalError({
        msgOrInteraction: msg,
        title: "Failed to claim tip!",
        description: `Mochi wallet's balance is insufficient to proceed this transaction.\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You can contact our developer at suggestion forum in [Mochi Discord](${DISCORD_URL})!\n${getEmoji(
          "ANIMATED_POINTING_RIGHT",
          true
        )} You can try to claim other tips and get back to this one later! ${getEmoji(
          "SOON"
        )}\nSorry for this inconvenience ${getEmoji("NEKOSAD")}`,
      })
    )
    expect(defi.getUserOnchainTransfers).not.toHaveBeenCalled()
  })
})
