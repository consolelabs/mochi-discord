# Command guideline

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
