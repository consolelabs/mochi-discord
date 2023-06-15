import { getEmoji } from "utils/common"
export function listSubmissionVault(submission: []) {
  let listSubmissionValue = ""
  submission.forEach((item: any) => {
    const quote = `<@${item.submitter}> has ${item.status} the request.\n`
    if (item.status === "approved") {
      listSubmissionValue += `${getEmoji("CHECK")} ${quote}`
    } else if (item.status === "rejected") {
      listSubmissionValue += `${getEmoji("REVOKE")} ${quote}`
    }
  })
  return listSubmissionValue
}

export function createActionLine(params: {
  action?: string
  vault?: string
  amount?: string
  token?: string
  transferTarget?: string
}) {
  switch (params.action) {
    case "add":
      return `add treasurer to ${params.vault}`
    case "remove":
      return `remove treasurer from ${params.vault}`
    case "transfer":
      return `send ${params.amount} ${params.token?.toUpperCase()} from ${
        params.vault
      } to ${params.transferTarget}`
  }
}
