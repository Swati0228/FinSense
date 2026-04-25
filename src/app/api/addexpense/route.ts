import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { checkBudgetAndNotify } from '@/utils/budgetAlerts';

export async function POST(req: NextRequest) {
  try {
    const { userId, date, amount, merchant, category, notes, recurring } = await req.json();

    if (!userId || !date || !amount || !merchant || !category || recurring === undefined) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const newExpense = {
      date,
      amount,
      merchant,
      category,
      notes,
      recurring,
    };

    user.expenses.push(newExpense as any);
    await user.save();

    // Trigger budget alert check in the background
    // We don't await this to keep the API response fast
    checkBudgetAndNotify(user, category, amount);

    return NextResponse.json({ message: 'Expense added successfully.', expense: newExpense }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'An error occurred while adding the expense.', details: error.message }, { status: 500 });
  }
}
