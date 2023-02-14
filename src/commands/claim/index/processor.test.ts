import defi from "adapters/defi"
import * as processor from "./processor"
import { getSuccessEmbed } from "ui/discord/embed"
import { getEmoji, roundFloatNumber, shortenHashOrAddress } from "utils/common"
import { assertDescription } from "../../../../tests/assertions/discord"
import { InternalError } from "errors"
import mockdc from "../../../../tests/mocks/discord"
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
    const pointingright = getEmoji("pointingright")
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
    assertDescription(output, expectedEmbed)
  })

  test("claimId is not a number", async () => {
    const args = ["claim", "x", "0xAbcAbc123"]
    defi.claimOnchainTransfer = jest.fn()
    await expect(processor.claim(msg, args)).rejects.toThrow(InternalError)
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
    defi.claimOnchainTransfer = jest
      .fn()
      .mockResolvedValueOnce(claimOnchainTransferRes)
    defi.getUserOnchainTransfers = jest
      .fn()
      .mockResolvedValueOnce(getUserOnchainTransfersRes)
    // const pointingright = getEmoji("pointingright")
    // const { data } = getUserOnchainTransfersRes
    // const expectedDes = (
    //   data?.length
    //     ? [
    //         `${pointingright} You may enter an invalid \`claim ID\` or claimed one!`,
    //         `${pointingright} You can pick one of these \`claim ID\`: ${data
    //           .map((tx: any) => tx.id)
    //           .join(", ")}`,
    //         `${pointingright} You can only claim one transaction at once.`,
    //       ]
    //     : [
    //         "You don't have any unclaimed tips. You can try to tip other by using `$tip`.",
    //       ]
    // ).join("\n")
    await expect(processor.claim(msg, args)).rejects.toThrow(InternalError)
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
    await expect(processor.claim(msg, args)).rejects.toThrow(InternalError)
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
    await expect(processor.claim(msg, args)).rejects.toThrow(InternalError)
    expect(defi.getUserOnchainTransfers).not.toHaveBeenCalled()
  })
})
