import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Authorization token is required or invalid.' }, { status: 401 });
    }

    const { month, totalBudget, categoryBudgets } = await req.json();

    if (!month) return NextResponse.json({ error: 'month is required (format: YYYY-MM)' }, { status: 400 });
    if (totalBudget === undefined || totalBudget === null) return NextResponse.json({ error: 'totalBudget is required' }, { status: 400 });

    await connectDB();
    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const existingPlanIndex = user.monthlyPlans.findIndex((plan) => plan.month === month);
    
    if (existingPlanIndex !== -1) {
      user.monthlyPlans[existingPlanIndex].totalBudget = totalBudget;
      if (categoryBudgets) {
        user.monthlyPlans[existingPlanIndex].categoryBudgets = categoryBudgets;
      }
      await user.save();
      return NextResponse.json({ message: 'Plan updated', plan: user.monthlyPlans[existingPlanIndex] }, { status: 200 });
    } else {
      const newPlan = { 
        month, 
        totalBudget,
        categoryBudgets: categoryBudgets || {
          food: 0, travel: 0, bills: 0, shopping: 0, entertainment: 0, others: 0
        }
      };
      user.monthlyPlans.push(newPlan as any);
      await user.save();
      return NextResponse.json({ message: 'Plan created', plan: user.monthlyPlans[user.monthlyPlans.length - 1] }, { status: 201 });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
