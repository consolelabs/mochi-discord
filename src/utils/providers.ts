import { ethers } from "ethers"

const ftm = new ethers.providers.JsonRpcProvider("https://rpc.ftm.tools/")
const eth = new ethers.providers.JsonRpcProvider(
  "https://mainnet.infura.io/v3/"
)
export default { ftm, eth }
