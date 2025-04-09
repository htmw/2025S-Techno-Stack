// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '../../../middleware/authMiddleware';
import { getProfileByUserId, updateProfile } from '../../../models/userModel';

// GET /api/profile - Get the authenticated user's profile
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const profile = await getProfileByUserId(user.id);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// POST /api/profile - Update or create the authenticated user's profile
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const profileData = await req.json();
    
    // Validate the profile data
    if (profileData.risk_tolerance && !['low', 'medium', 'high'].includes(profileData.risk_tolerance)) {
      return NextResponse.json(
        { error: 'Invalid risk tolerance value' },
        { status: 400 }
      );
    }
    
    if (profileData.investment_horizon && !['short', 'medium', 'long'].includes(profileData.investment_horizon)) {
      return NextResponse.json(
        { error: 'Invalid investment horizon value' },
        { status: 400 }
      );
    }
    
    if (profileData.investment_goal && !['retirement', 'growth', 'income'].includes(profileData.investment_goal)) {
      return NextResponse.json(
        { error: 'Invalid investment goal value' },
        { status: 400 }
      );
    }
    
    // Convert budget and monthly_contribution to numbers
    if (profileData.budget) {
      profileData.budget = parseFloat(profileData.budget);
      if (isNaN(profileData.budget) || profileData.budget < 0) {
        return NextResponse.json(
          { error: 'Invalid budget value' },
          { status: 400 }
        );
      }
    }
    
    if (profileData.monthly_contribution) {
      profileData.monthly_contribution = parseFloat(profileData.monthly_contribution);
      if (isNaN(profileData.monthly_contribution) || profileData.monthly_contribution < 0) {
        return NextResponse.json(
          { error: 'Invalid monthly contribution value' },
          { status: 400 }
        );
      }
    }
    
    // Update or create the profile
    const updatedProfile = await updateProfile({
      user_id: user.id,
      ...profileData
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully', 
      profile: updatedProfile 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}