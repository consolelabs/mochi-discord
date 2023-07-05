import { render, View } from "./processor"
import { CommandInteraction, Message } from "discord.js"
import { MachineConfig, route, RouterSpecialAction } from "utils/router"

const machineConfig: (ctx: any) => MachineConfig = (ctx) => ({
  id: "inbox",
  initial: "unreadList",
  context: {
    button: {
      unreadList: (i, _ev, ctx) =>
        render(i.user.id, {
          ...ctx,
          page: ctx.page,
          view: View.Unread,
        }),
      readList: (i, _ev, ctx) =>
        render(i.user.id, {
          ...ctx,
          page: ctx.page,
          view: View.Read,
        }),
    },
    page: 0,
    ...ctx,
  },
  states: {
    unreadList: {
      on: {
        VIEW_READ_LIST: "readList",
        SEE_NEXT_UNREAD: "unreadList",
      },
    },
    readList: {
      on: {
        VIEW_UNREAD_LIST: "unreadList",
        [RouterSpecialAction.PREV_PAGE]: "readList",
        [RouterSpecialAction.NEXT_PAGE]: "readList",
      },
    },
  },
})

const run = async (i: CommandInteraction) => {
  const userDiscordID = i.user.id
  const { msgOpts, context } = await render(userDiscordID, {
    page: 0,
    view: View.Unread,
  })

  const reply = (await i.editReply(msgOpts)) as Message

  route(reply, i, machineConfig(context))

  return null
}
export default run
