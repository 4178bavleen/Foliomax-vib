// src/services/testing-2-kafka/producer.js
const { Kafka } = require("kafkajs");
require("dotenv").config();

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
const topic = process.env.KAFKA_TOPIC || "test-topic";

const kafka = new Kafka({
  clientId: "fm-producer",
  brokers,
  retry: {
    initialRetryTime: 300,
    retries: 8, // allow more retries for transient leader elections
  },
});

const producer = kafka.producer();
let _connected = false;

async function connectIfNeeded() {
  if (!_connected) {
    await producer.connect();
    _connected = true;
    console.log("Producer connected to", brokers);
  }
}

/**
 * Produce a JSON message to the topic.
 * nameObj can be { name: 'Aabhas' } or any JSON-serializable object.
 */
async function produce(nameObj) {
  await connectIfNeeded();
  const result = await producer.send({
    topic,
    messages: [{ key: String(Date.now()), value: JSON.stringify(nameObj) }],
  });
  console.log("Message produced:", result);
  return result;
}

// optional graceful shutdown (call on app shutdown)
async function disconnect() {
  if (_connected) {
    await producer.disconnect();
    _connected = false;
  }
}

// if (require.main === module) {
//   // quick local test if you run: node producer.js
//   produce({ test: "hello-from-producer" })
//     .then(() => process.exit(0))
//     .catch((err) => {
//       console.error(err);
//       process.exit(1);
//     });
// }

module.exports = { produce, disconnect };
