// import { CommandInteraction, Message } from "discord.js"
// import { ResponseRoleReactionByMessage } from "../../../types/api"
// import mockdc from "../../../../tests/mocks/discord"
// import * as processor from "./processor"

// describe("transformEmbedPagination", () => {
//   let msg: Message | CommandInteraction
//   const data: ResponseRoleReactionByMessage[] = [
//     {
//       channel_id: "",
//       message_id: "",
//       roles: [],
//     },
//   ]
//   afterEach(() => jest.clearAllMocks())

//   test("with text message", async () => {
//     msg = mockdc.cloneMessage()
//     const output = await processor.transformEmbedPagination(data, msg)
//   })

//   test("with command interaction", async () => {
//     msg = mockdc.cloneCommandInteraction()
//     const output = await processor.transformEmbedPagination(data, msg)
//   })
// })
