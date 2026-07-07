import { ethers } from "ethers"
import fetch from "node-fetch"
// tslint:disable-next-line:no-any
declare const global: any
global.fetch = fetch

// StaticJsonRpcProvider pins the network (mainnet = 1) so ethers never re-runs
// detectNetwork. The old endpoint (eth.llamarpc.com) went dead (HTTP 521); against a
// dead RPC, ethers retried network detection for ~25s on every ENS lookup, which stalled
// the /bal render. publicnode is a reliable, key-less public RPC.
const eth = new ethers.providers.StaticJsonRpcProvider(
  "https://ethereum-rpc.publicnode.com",
  1,
)

// NOTE: the previous `ftm` provider (rpc.ftm.tools, now HTTP 401 "API key disabled") was
// only used by the removed gas-tracker / getFtmPrice code and has no remaining references,
// so it is dropped.
export default { eth }
