import { render } from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

const machineConfig: MachineConfig = {
  id: "activity",
  initial: "activity",
  context: {
    button: {
      activity: (i, _ev, ctx) => {
        return render(i.user.id, ctx.page)
      },
    },
    page: 0,
  },
  states: {
    activity: {
      on: {
        [RouterSpecialAction.PREV_PAGE]: "activity",
        [RouterSpecialAction.NEXT_PAGE]: "activity",
      },
    },
  },
}

export const run = async (i: CommandInteraction) => {
  const userDiscordId = i.user.id
  const { msgOpts } = await render(userDiscordId, 0)
  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig)
}

export default run
