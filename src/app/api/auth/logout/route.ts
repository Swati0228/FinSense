import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { getUserFromRequest, verifyRefreshToken } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const decoded = getUserFromRequest(req);

    let refreshToken = '';
    try {
      const body = await req.json();
      refreshToken = body?.refreshToken || '';
    } catch {
      // no-op: allow logout via Authorization header only
    }

    await connectDB();

    if (decoded?.id) {
      await User.findByIdAndUpdate(decoded.id, { refreshToken: '' });
      return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    }

    // Fallback: if access token expired, allow logout with valid refresh token
    const refreshDecoded = refreshToken ? verifyRefreshToken(refreshToken) : null;
    if (!refreshDecoded?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(refreshDecoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    user.refreshToken = '';
    await user.save();

    return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
