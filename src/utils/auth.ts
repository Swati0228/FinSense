import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface DecodedToken {
  id: string;
  email: string;
}

export function generateTokens(id: string, email: string): { accessToken: string; refreshToken: string } {
  const secret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!secret || !refreshSecret) throw new Error('JWT secrets not set');

  const accessToken = jwt.sign({ id, email }, secret, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id, email }, refreshSecret, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

export function getUserFromRequest(request: NextRequest): DecodedToken | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not set in environment variables');
      return null;
    }

    return jwt.verify(token, secret) as DecodedToken;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      console.error('JWT_REFRESH_SECRET is not set');
      return null;
    }
    return jwt.verify(token, secret) as DecodedToken;
  } catch {
    return null;
  }
}
