import { BotBaseError, OriginalMessage } from "./base"

export class APIError extends BotBaseError {
  specificError: string
  curl = "None"

  constructor({
    msgOrInteraction,
    description,
    curl,
    error,
  }: {
    msgOrInteraction?: OriginalMessage
    description: string
    curl: string
    error?: string
  }) {
    super(msgOrInteraction, description)
    this.name = "API error"
    this.curl = curl
    this.specificError = error ?? description
  }

  handle() {
    return
  }
}
