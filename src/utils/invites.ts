import { Collection } from "discord.js"

export const invites = new Collection<string, Collection<string, number>>()
