import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/utils/auth';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ planId: string }> }) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { planId } = await params;
    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const planIndex = user.monthlyPlans.findIndex((p: any) => p._id.toString() === planId);
    if (planIndex === -1) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    user.monthlyPlans.splice(planIndex, 1);
    await user.save();
    return NextResponse.json({ message: 'Plan deleted' }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
