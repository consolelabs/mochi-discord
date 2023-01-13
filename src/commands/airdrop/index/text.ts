import defi from "adapters/defi"
import { Message } from "discord.js"
import { APIError } from "errors"
import { getCommandArguments } from "utils/commands"
import { handleAirdrop } from "./processor"

export const run = async (msg: Message) => {
  const args = getCommandArguments(msg)
  const payload = await defi.getAirdropPayload(msg, args)
  // check balance
  const {
    ok,
    data = [],
    log,
    curl,
  } = await defi.offchainGetUserBalances({
    userId: payload.sender,
  })

  // tipbot response shouldn't be null
  if (!ok || !data) {
    throw new APIError({ curl: curl, description: log })
  }

  return await handleAirdrop(msg, payload, data)
}

export default run
