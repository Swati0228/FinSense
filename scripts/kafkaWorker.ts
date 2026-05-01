import { Kafka } from 'kafkajs';
import connectDB from '../src/lib/db';
import { checkBudgetAndNotify } from '../src/utils/budgetAlerts';

const brokers = process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'];

const kafka = new Kafka({
  clientId: 'finsense-worker',
  brokers: brokers,
});

const consumer = kafka.consumer({ groupId: 'budget-alerts-group' });

const run = async () => {
  await connectDB();
  
  await consumer.connect();
  console.log('Connected to Kafka consumer');
  
  await consumer.subscribe({ topic: 'expense-created', fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const eventData = JSON.parse(message.value?.toString() || '{}');
        console.log(`Received event on topic ${topic}:`, eventData);
        
        if (topic === 'expense-created') {
          const { userId, email, name, category, amount } = eventData;
          
          const userObj = {
            _id: userId,
            email,
            name,
            emailAlerts: true 
          };
          
          await checkBudgetAndNotify(userObj as any, category, amount);
          console.log(`Processed budget alert for user ${userId}`);
        }
      } catch (error) {
        console.error('Error processing Kafka message:', error);
      }
    },
  });
};

run().catch(console.error);
