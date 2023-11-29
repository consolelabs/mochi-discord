import { BotBaseError, OriginalMessage } from "./base"

export class APIError extends BotBaseError {
  specificError: string
  curl = "None"
  status: number

  constructor({
    msgOrInteraction,
    description,
    curl,
    status,
    error,
  }: {
    msgOrInteraction?: OriginalMessage
    description: string
    curl: string
    status: number
    error?: string
  }) {
    super(msgOrInteraction, description)
    this.name = "API error"
    this.curl = curl
    this.status = status
    this.specificError = error ?? description
  }

  handle() {
    return
  }
}
