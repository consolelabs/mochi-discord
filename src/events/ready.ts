import { Event } from "."
import Discord from "discord.js"
import { PREFIX } from "../env"
import { logger } from "../logger"
import ChannelLogger from "utils/ChannelLogger"
import CommandChoiceManager from "utils/CommandChoiceManager"

export default {
  name: "ready",
  once: false,
  execute: async (listener: Discord.Client) => {
    logger.info("Bot is ready")
    ChannelLogger.ready(listener)
    CommandChoiceManager.client = listener
    // get balance and show in presence message every 10m
    const presence = async () => {
      listener.user.setPresence({
        status: "online",
        activities: [
          {
            name: `${PREFIX}help`,
            type: "WATCHING",
          },
        ],
      })
    }
    runAndSetInterval(presence, 600000)

    // if (ENV !== "dev") {
    //   // interval update pod together roles
    //   const podTogetherRolesUpdater = async () => {
    //     Roles.updatePodTogetherRoles(listener)
    //   }

    //   runAndSetInterval(podTogetherRolesUpdater, 300000) // 5min
    // }
  },
} as Event<"ready">

function runAndSetInterval(fn: () => void, ms: number) {
  fn()
  setInterval(fn, ms)
}
