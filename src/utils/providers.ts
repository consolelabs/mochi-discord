import { ethers } from "ethers"
import fetch from "node-fetch"
// tslint:disable-next-line:no-any
declare const global: any
global.fetch = fetch

const ftm = new ethers.providers.JsonRpcProvider("https://rpc.ftm.tools/")
const eth = new ethers.providers.JsonRpcProvider("https://eth.llamarpc.com", 1)

export default { ftm, eth }
