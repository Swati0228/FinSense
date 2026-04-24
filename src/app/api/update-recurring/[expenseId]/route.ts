import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/utils/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ expenseId: string }> }) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token is required or invalid.' }, { status: 401 });
    }

    const { expenseId } = await params;

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const expense = user.expenses.find((exp: any) => exp._id.toString() === expenseId);

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found.' }, { status: 404 });
    }

    expense.recurring = false;
    await user.save();

    return NextResponse.json({ message: 'Recurring expense updated successfully.', expense }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'An error occurred while updating the expense.' }, { status: 500 });
  }
}
