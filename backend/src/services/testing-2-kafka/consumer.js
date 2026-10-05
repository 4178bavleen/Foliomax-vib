// src/services/testing-2-kafka/consumer.js
const { Kafka } = require('kafkajs');
require('dotenv').config();

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const topic = process.env.KAFKA_TOPIC || 'test-topic';
const groupId = process.env.KAFKA_GROUP_ID || 'fm-test-group';

const kafka = new Kafka({
  clientId: 'fm-consumer',
  brokers,
});

const consumer = kafka.consumer({ groupId });

async function runConsumer() {
  await consumer.connect();
  console.log('Consumer connected to', brokers, 'groupId=', groupId);

  await consumer.subscribe({ topic, fromBeginning: true });
  console.log('Subscribed to topic', topic);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      // Print hello world and the message JSON
      console.log('hello world'); // <- your requested print
      const raw = message.value ? message.value.toString() : null;
      try {
        const parsed = JSON.parse(raw);
        console.log('Received message:', parsed);
      } catch (e) {
        console.log('Received non-JSON message:', raw);
      }
    }
  });
}

// allow running consumer directly: `node consumer.js`
if (require.main === module) {
  runConsumer().catch(err => {
    console.error('consumer failed', err);
    process.exit(1);
  });
}

module.exports = { runConsumer };
