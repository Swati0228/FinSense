import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { generateTokens } from '@/utils/auth';

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, email, password, otp } = await req.json();

    if (!name || !email || !password || !otp) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { accessToken, refreshToken } = generateTokens('placeholder', email);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      refreshToken,
    });

    await newUser.save();
    await OTP.deleteMany({ email });

    // Re-generate tokens with the real user ID
    const { accessToken: finalAccess, refreshToken: finalRefresh } = generateTokens(
      String(newUser._id),
      newUser.email
    );
    newUser.refreshToken = finalRefresh;
    await newUser.save();

    return NextResponse.json(
      { message: 'User created successfully', token: finalAccess, refreshToken: finalRefresh },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
