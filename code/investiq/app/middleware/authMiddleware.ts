// middleware/authMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { getUserById } from '../models/userModel';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Function to get authenticated user from JWT token
export async function getAuthUser(req: NextRequest) {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    // Get the user from the database
    const user = await getUserById(decoded.userId);
    
    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Middleware to authenticate API routes
export async function authenticateRoute(req: NextRequest) {
  const user = await getAuthUser(req);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}