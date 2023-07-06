import { SlashCommandSubcommandBuilder } from "@discordjs/builders"
import { Message } from "discord.js"
import { SlashCommand } from "types/common"
import { route } from "utils/router"
import { machineConfig, Option, render } from "../processor"

const options: Option[] = [
  {
    label: "Aggregate collection stats",
    labelDoing: "Collecting floor price, volume, sales...",
    labelDone: "All metrics ready",
    value: "setup-nft/aggregate-stats",
    handler: async () => await new Promise((r) => setTimeout(r, 8000)),
    required: true,
  },
  {
    label: "Index collection transactions",
    labelDoing: "Indexing collection transactions...",
    labelDone: "All transactions indexed",
    value: "setup-nft/index-transasctions",
    handler: async () => await new Promise((r) => setTimeout(r, 5000)),
    required: true,
  },
  {
    label: "Track collection holders",
    labelDoing: "Querying holder wallets...",
    labelDone: "All holders tracked",
    value: "setup-nft/query-holders",
    handler: async () => await new Promise((r) => setTimeout(r, 6000)),
    required: true,
  },
  {
    label: "Rank & parse rarity of tokens",
    labelDoing: "Running ranking algorithm...",
    labelDone: "All tokens rarity ranked",
    value: "setup-nft/rank-rarity-tokens",
    handler: async () => await new Promise((r) => setTimeout(r, 4000)),
    required: true,
  },
  {
    label: "Create buy/sell channels",
    labelDoing: "Creating buy/sell channels...",
    labelDone: "Buy/sell channels created",
    value: "setup-nft/create-buy-sell-channels",
    handler: async () => await new Promise((r) => setTimeout(r, 2300)),
  },
  {
    label: "Setup NFT role",
    labelDoing: "Creating NFT roles...",
    labelDone: "Created NFT roles",
    value: "setup-nft/nft-roles",
    handler: async () => await new Promise((r) => setTimeout(r, 4000)),
  },
  {
    label: "Create gated channel for NFT holders",
    labelDoing: "Creating channels for NFT holders...",
    labelDone: "Gated channels created",
    value: "setup-nft/gated-channels-for-nft-holder",
    handler: async () => await new Promise((r) => setTimeout(r, 4000)),
  },
]

const slashCmd: SlashCommand = {
  name: "nft",
  category: "Config",
  prepare: () => {
    return new SlashCommandSubcommandBuilder()
      .setName("nft")
      .setDescription("Setup NFT configs for a collection")
      .addStringOption((opt) =>
        opt
          .setName("chain")
          .setDescription("chain of the collection")
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt
          .setName("address")
          .setDescription("the collection address")
          .setRequired(true)
      )
  },
  onlyAdministrator: true,
  run: async function (i) {
    const { msgOpts, context } = await render(i, {
      id: "nft",
      options,
      currentOptions: [
        "setup-nft/aggregate-stats",
        "setup-nft/index-transasctions",
        "setup-nft/query-holders",
        "setup-nft/rank-rarity-tokens",
      ],
    })
    const reply = (await i.editReply(msgOpts)) as Message

    route(reply, i, machineConfig("nft", context))
  },
  help: () => {
    return Promise.resolve({})
  },
  colorType: "Command",
  ephemeral: true,
}

export { slashCmd }
