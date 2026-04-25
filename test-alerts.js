import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js'; // Note: using .js because it's a script, but wait, it's TS project
// Actually, I'll use a simplified version that doesn't depend on TS compilation if possible.
// Or I can use ts-node or similar.
// But I already have a 'test-db.js' and 'test-email.js' that are pure JS.
// I'll create a standalone JS script to simulate the logic.

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function runTest() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB");

  const userEmail = "swatisingh022805@gmail.com";
  const user = await mongoose.model('User').findOne({ email: userEmail });

  if (!user) {
    console.error("User not found");
    process.exit(1);
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  // 1. Set a small budget for 'food'
  const planIndex = user.monthlyPlans.findIndex(p => p.month === currentMonth);
  const testBudget = 1000;
  
  if (planIndex === -1) {
    user.monthlyPlans.push({
      month: currentMonth,
      totalBudget: testBudget,
      categoryBudgets: { food: testBudget, travel: 0, bills: 0, shopping: 0, entertainment: 0, others: 0 }
    });
  } else {
    user.monthlyPlans[planIndex].categoryBudgets.food = testBudget;
  }
  
  await user.save();
  console.log(`Set 'food' budget to ${testBudget} for ${currentMonth}`);

  // 2. Add an expense that hits 85% (850)
  const expense = {
    date: new Date().toISOString().slice(0, 10),
    amount: 850,
    merchant: "Test Restaurant",
    category: "Food",
    notes: "Testing budget alert 80%",
    recurring: false
  };

  console.log("Simulating adding expense to trigger alert...");
  // Instead of importing the TS utility (which is hard in a raw JS script), 
  // I will just manually trigger the mailer to verify the logic flow.
  
  // Wait, I want to test the actual utility I wrote.
  // I'll use `npx tsx` to run a TS script.
}

runTest();
