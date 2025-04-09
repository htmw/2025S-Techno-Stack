// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../../middleware/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}