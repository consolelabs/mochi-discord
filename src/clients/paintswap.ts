import { MarketplaceV3 } from "@paintswap/marketplace-interactions"
import { ethers } from "ethers"

const provider = new ethers.providers.JsonRpcProvider("https://rpc.ftm.tools/")
const marketplace = new MarketplaceV3(provider)

export default marketplace
