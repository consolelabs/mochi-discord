# Command guideline

## General

| ![command](/images/1.png) | ![command](/images/2.png) | ![command](/images/3.png) | ![command](/images/4.png) |
| ------------------------- | ------------------------- | ------------------------- | ------------------------- |

Whenever you create a new command or fine-tune existing ones, some rules must apply:

- Every command ouput except for help messages or error messages must include a header
- Header text should follow the pattern `context text [dot] <username> [dot] CTAs (if any)`
- Body must be an embed message
- You shouldn't use message's fields to render table (because it will break when render on mobile view)
- Do not wrap command's `run` in `try/catch` clause, if there is an error, throw it so the upper level can catch it and do proper logging, for readability or granular control, consider creating a separate error class for that

---

- Body selection (in the embed) should be either 2 types:
  - 1 line, `:emoji_number: [vertical bar] text`
  - 2 line
  ```
  <:emoji_number:> <:emoji:> text
  <:emoji:> description
  ```

---

- Footer is divided into 3 types:
  - Empty (no footer)
  - `text [dot] text [dot] <timestamp>/<page>` (no more than 2 dots and the last part must be either timestamp or page indicator)
  - Same as above but with user avatar for personalized feedback
    `<avatar> text [dot] text [dot] <timestamp>/<page>`

---

- Message components:
  - Should include buttons depends on the context/goal of that command
  - Should include exit button if that command includes a series of user actions (buttons/selections)

---

- Command will close after an amount of inactivity has passed (default 5 min)

## Ok/Failed message

A ok/failed message response must have the following properties to be considered standard:

- Color of the embed is either `SUCCESS` or `ERROR` (see [here](https://github.com/consolelabs/mochi-bot/blob/526dfbc30f5fd1e1f53f168b9d60419f365d3286/src/utils/common.ts#L157))
- The icon is either ![error icon](https://cdn.discordapp.com/emojis/933341948431962172.webp?size=32&quality=lossless) or ![success icon](https://cdn.discordapp.com/emojis/933341948402618378.webp?size=32&quality=lossless)

In short, just use the `getErrorEmbed()` or `getSuccessEmbed()` method to easily conform to the above interface

### Nice to have

Provide better contextual message when responding to users' action, this forces you to think about the bot as a product and what it can do rather than a big chunk of different functions

| Don't                                                                                                                           | Do                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repeat what the user just did<br/>It's redundant and has a stiff tone when read (too robotic)<br/>![](/images/message-dont.png) | Provide additional info to let users know what is the effect of their action, what to do next, etc...<br/>Also a friendlier tone helps too<br/>![](/images/message-do.png) |
