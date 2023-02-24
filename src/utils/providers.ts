import { ethers } from "ethers"

const ftm = new ethers.providers.JsonRpcProvider("https://rpc.ftm.tools/")
const eth = new ethers.providers.JsonRpcProvider("https://rpc.ankr.com/eth")

export default { ftm, eth }
