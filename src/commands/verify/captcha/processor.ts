import {
  ButtonInteraction,
  CommandInteraction,
  Message,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Role,
} from "discord.js"
import { composeEmbedMessage } from "ui/discord/embed"
import { getEmoji, getEmojiURL, msgColors } from "utils/common"
import { MachineConfig, route } from "utils/router"

const BACKSPACE = "\u232b"
const ENTER = "﫻"

const machineConfig: MachineConfig = {
  id: "verify",
  initial: "verifyStep1",
  context: {
    button: {
      verifyStep1: (i) => step1(i),
      moreInfo: (i) => moreInfo(i),
      verifyStep2: (i) => step2(i),
      verifyStep3: (i, ev, ctx) =>
        step3(i, {
          ...ctx,
          answer: ctx.answer,
          attemptsLeft: ctx.attemptsLeft,
          input:
            ev === "REMOVE"
              ? String(ctx.input).slice(0, -1)
              : ev === "CONTINUE"
              ? ctx.input
              : `${ctx.input}${i.customId}`.slice(0, 4),
        }),
      verifyStep3Error: async (_i, _ev, ctx) => {
        if (ctx.attemptsLeft > 0) {
          return {
            context: {
              attemptsLeft: ctx.attemptsLeft - 1,
            },
            msgOpts: {
              embeds: [
                new MessageEmbed({
                  color: msgColors.ERROR,
                  description: `Please try again, you have ${ctx.attemptsLeft} attempt(s) left before you get banned.`,
                }),
              ],
            },
          }
        }
        return {
          msgOpts: {
            embeds: [
              new MessageEmbed({
                color: msgColors.ERROR,
                description:
                  "You have reached maximum attempt and will be banned from this server",
              }),
            ],
          },
        }
      },
      verifyStep4: (i) => step4(i),
    },
    input: "",
    answer: "0000",
  },
  states: {
    // disable DM
    verifyStep1: {
      on: {
        CONTINUE: "verifyStep2",
        VIEW_MORE_INFO: "moreInfo",
      },
    },
    moreInfo: {
      on: {
        BACK: "verifyStep1",
      },
    },
    // read
    verifyStep2: {
      on: {
        CONTINUE: "verifyStep3",
      },
    },
    // captcha
    verifyStep3: {
      on: {
        REMOVE: "verifyStep3",
        "*": [
          {
            target: "verifyStep4",
            cond: "isCaptchaValid",
          },
          {
            target: "verifyStep3",
            cond: (_ctx, ev) => ev.type !== "BACK",
          },
        ],
      },
    },
    verifyStep3Error: {
      on: {
        TRY_AGAIN: "verifyStep3",
      },
    },
    verifyStep4: {
      type: "final",
    },
  },
}

type Context = {
  input: string
  answer: string
  attemptsLeft: number
}

async function step1(i: ButtonInteraction) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Step 1", getEmojiURL("1101445056658952233")],
          description: [
            `turn off DM something something`,
            `it's for your own good something something`,
          ].join("\n"),
          thumbnail: i.guild?.iconURL(),
        }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            style: "PRIMARY",
            label: "Continue",
            customId: "continue",
          }),
          new MessageButton({
            style: "SECONDARY",
            label: "More Info",
            customId: "view_more_info",
          })
        ),
      ],
    },
  }
}
async function step2(i: ButtonInteraction) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Step 2", getEmojiURL("1101445056658952233")],
          description: [`follow the rule or you ded kek`].join("\n"),
          thumbnail: i.guild?.iconURL(),
        }),
      ],
      components: [
        new MessageActionRow().addComponents(
          new MessageButton({
            style: "PRIMARY",
            label: "Continue",
            customId: "continue",
          })
        ),
      ],
    },
  }
}
async function step3(i: ButtonInteraction, ctx: Context) {
  return {
    context: {
      input: ctx.input,
    },
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Step 3", getEmojiURL("1101445056658952233")],
          description: [`enter the code br br br br brrrr, it's 0000 btw`].join(
            "\n"
          ),
          thumbnail: i.guild?.iconURL(),
        }),
        new MessageEmbed({
          description: `\`\`\`${" ".repeat(6)}${" ".repeat(
            4 - ctx.input.length
          )}${ctx.input}${" ".repeat(10)}\`\`\``,
        }),
      ],
      components: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [BACKSPACE, 0, ENTER],
      ]
        .map((row) =>
          new MessageActionRow().addComponents(
            ...row.map(
              (c) =>
                new MessageButton({
                  style:
                    c === BACKSPACE
                      ? "DANGER"
                      : c === ENTER
                      ? "SUCCESS"
                      : "SECONDARY",
                  label: String(c),
                  customId: String(
                    c === BACKSPACE ? "REMOVE" : c === ENTER ? "CONTINUE" : c
                  ),
                })
            )
          )
        )
        .flat(),
    },
  }
}
async function step4(i: ButtonInteraction) {
  return {
    msgOpts: {
      embeds: [
        composeEmbedMessage(null, {
          author: ["Done", getEmojiURL("1101445056658952233")],
          description: [
            `congrats you got the role, now get out of here bye`,
          ].join("\n"),
          thumbnail: i.guild?.iconURL(),
        }),
      ],
      components: [],
    },
  }
}
async function moreInfo(i: ButtonInteraction) {
  return {
    msgOpts: {
      content: "more info",
    },
  }
}

export async function handleBeginVerify(i: ButtonInteraction) {
  if (!i.deferred) {
    await i.deferReply({ ephemeral: true })
  }

  const { msgOpts } = await step1(i)

  const reply = (await i.followUp({
    ephemeral: true,
    fetchReply: true,
    ...msgOpts,
  })) as Message

  route(reply, i, machineConfig, {
    guards: {
      isCaptchaValid: (_ctx, ev) => {
        if (ev.type === "BACK") return false
        return (
          `${ev.context?.input}${ev.interaction.customId}` ===
          ev.context?.answer
        )
      },
    },
  })
}

export async function run(i: CommandInteraction) {
  return {
    messageOptions: {
      content: "WIP",
    },
  }
  // const role = i.options.getRole("for_role", true) as Role
  //
  // const embed = composeEmbedMessage(null, {
  //   author: ["Hello there", getEmojiURL("1101445056658952233")],
  //   description: [
  //     `${getEmoji(
  //       "ANIMATED_POINTING_RIGHT",
  //       true
  //     )} In order to get the ${role} and gain access to the server, you must complete the following verification process.`,
  //     `${getEmoji(
  //       "ANIMATED_POINTING_RIGHT",
  //       true
  //     )} Click on \`Verify\` to get started`,
  //   ].join("\n"),
  //   thumbnail: i.guild?.iconURL(),
  // })
  //
  // await i.channel?.send({
  //   embeds: [embed],
  //   components: [
  //     new MessageActionRow().addComponents(
  //       new MessageButton({
  //         label: "Verify",
  //         style: "PRIMARY",
  //         customId: `verify-captcha_${role.id}`,
  //       })
  //     ),
  //   ],
  // })
  //
  // return {
  //   messageOptions: {
  //     content:
  //       "A new verification entry point has been added, you can dismiss this message now.",
  //   },
  // }
}
