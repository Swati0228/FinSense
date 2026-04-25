import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/lib/db';
import User from './src/models/User';
import { checkBudgetAndNotify } from './src/utils/budgetAlerts';

dotenv.config();

async function runTest() {
  try {
    await connectDB();
    console.log("Connected to DB");

    const userEmail = "swatisingh022805@gmail.com";
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.error("User not found");
      process.exit(1);
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const category = "Food";
    const budgetValue = 1000;

    // 1. Ensure a monthly plan exists with a 1000 budget for Food
    let plan = user.monthlyPlans.find(p => p.month === currentMonth);
    if (!plan) {
      user.monthlyPlans.push({
        month: currentMonth,
        totalBudget: budgetValue,
        categoryBudgets: { food: budgetValue, travel: 0, bills: 0, shopping: 0, entertainment: 0, others: 0 }
      } as any);
      plan = user.monthlyPlans[user.monthlyPlans.length - 1];
    } else {
      plan.categoryBudgets.food = budgetValue;
    }

    // 2. Clear existing expenses for this month/category to have a clean test
    user.expenses = user.expenses.filter(e => !(e.category.toLowerCase() === 'food' && e.date.startsWith(currentMonth)));
    
    // 3. Add an expense that hits 85%
    const amount = 850;
    user.expenses.push({
      date: new Date().toISOString().slice(0, 10),
      amount: amount,
      merchant: "Test Restaurant",
      category: "Food",
      notes: "Testing budget alert 80%",
      recurring: false
    } as any);

    await user.save();
    console.log(`Saved user with ${amount} expense. Category budget is ${plan.categoryBudgets.food}`);

    console.log("Triggering checkBudgetAndNotify...");
    await checkBudgetAndNotify(user, category, amount);

    console.log("Test completed. Check email for warning (80%).");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runTest();
