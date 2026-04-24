import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { verifyRefreshToken, generateTokens } from '@/utils/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Verify the refresh token signature & expiry
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    await connectDB();

    // Ensure the token matches what's stored (prevents reuse after logout)
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Rotate: issue a brand-new pair of tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      String(user._id),
      user.email
    );

    user.refreshToken = newRefreshToken;
    await user.save();

    return NextResponse.json(
      {
        message: 'Token refreshed successfully',
        token: accessToken,
        refreshToken: newRefreshToken,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Refresh token error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}
