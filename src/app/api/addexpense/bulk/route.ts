import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    const { expenses } = await req.json();

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return NextResponse.json({ error: 'Valid expenses array is required.' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Append all parsed expenses to user's expenses array
    user.expenses.push(...expenses);
    await user.save();

    return NextResponse.json({ 
      message: `${expenses.length} expenses imported successfully.`, 
      importedCount: expenses.length 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ 
      error: 'An error occurred while importing expenses.', 
      details: error.message 
    }, { status: 500 });
  }
}
