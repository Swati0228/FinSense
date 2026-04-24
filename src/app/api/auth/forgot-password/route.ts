import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';
import OTP from '@/models/OTP';
import { sendEmail } from '@/utils/mailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ message: 'Email is required' }, { status: 400 });

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (!existingUser) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
        <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); border-radius: 12px; font-weight: 900; color: #ffffff; font-size: 20px; line-height: 48px; text-align: center; border: 1px solid rgba(255,255,255,0.2); margin-bottom: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">FS</div>
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Password Recovery</h1>
      </div>
      <div style="padding: 40px 32px; background-color: #ffffff;">
        <p style="color: #475569; font-size: 16px; line-height: 26px; margin-top: 0; margin-bottom: 24px;">We received a request to reset the password for your FinSense account. You can use the following OTP to securely establish a new password.</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
          <span style="display: block; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Your Recovery Code</span>
          <strong style="font-size: 42px; color: #0f172a; letter-spacing: 8px;">${otp}</strong>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-bottom: 12px;">This code is valid for <strong style="color: #0f172a;">5 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-bottom: 0;">If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 13px; font-weight: 500;">&copy; ${new Date().getFullYear()} FinSense. All rights reserved.</p>
      </div>
    </div>`;
    
    const sent = await sendEmail(email, 'FinSense - Password Recovery', html);
    if (!sent) return NextResponse.json({ message: 'Failed to send OTP email' }, { status: 500 });
    
    return NextResponse.json({ message: 'OTP sent successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}
