import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/utils/auth';

export async function GET(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token is required or invalid.' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const recurringExpenses = user.expenses ? user.expenses.filter((expense) => expense.recurring === true) : [];
    
    return NextResponse.json({ 
      success: true,
      recurringExpenses 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching recurring expenses:', error);
    return NextResponse.json({ error: 'Server error.', details: error.message }, { status: 500 });
  }
}
