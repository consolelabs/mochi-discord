import Queue from "."

/* eslint-disable no-console */
export const run = async () => {
  const queue = new Queue()
  await queue.connect()
  return queue
}

run().catch(console.error)
