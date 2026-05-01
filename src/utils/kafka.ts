import { Kafka } from 'kafkajs';

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

export const kafka = new Kafka({
  clientId: 'finsense-app',
  brokers: brokers,
});

export const producer = kafka.producer();

let isProducerConnected = false;

export const connectProducer = async () => {
  if (isProducerConnected) return;
  try {
    await producer.connect();
    isProducerConnected = true;
    console.log('Connected to Kafka producer');
  } catch (error) {
    console.error('Failed to connect to Kafka producer', error);
  }
};

export const publishEvent = async (topic: string, message: any) => {
  await connectProducer();
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) },
      ],
    });
  } catch (error) {
    console.error(`Failed to publish event to ${topic}`, error);
  }
};
