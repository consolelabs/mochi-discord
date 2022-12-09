import Queue from "./utils/Queue"

/* eslint-disable no-console */
const run = async () => {
  const queue = new Queue()
  await queue.connect()

  // receive topic from arguments
  const topic = process.argv[2]
  // receive message from arguments
  const message = process.argv[3]

  if (!topic || !message) {
    throw new Error("Topic and message are required")
  }

  await queue.produceBatch(topic, [message])
  await queue.disconnect()
}

run().catch(console.error)
