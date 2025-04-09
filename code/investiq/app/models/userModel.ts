// models/userModel.ts
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string;
  user_id: string;
  risk_tolerance: string | null;
  investment_horizon: string | null;
  investment_goal: string | null;
  budget: number | null;
  monthly_contribution: number | null;
  tax_bracket: string | null;
  created_at: Date;
  updated_at: Date;
}

export async function getUserById(id: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, name, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name, created_at, updated_at',
      [email, name, hashedPassword]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function verifyUserCredentials(email: string, password: string): Promise<User | null> {
  try {
    const result = await query(
      'SELECT id, email, name, password, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    
    if (!isValid) {
      return null;
    }
    
    // Remove password from the user object
    delete user.password;
    
    return user;
  } catch (error) {
    console.error('Error verifying user credentials:', error);
    throw error;
  }
}

export async function getProfileByUserId(userId: string): Promise<Profile | null> {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [userId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching profile by user ID:', error);
    throw error;
  }
}

export async function createProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
  try {
    const result = await query(
      `INSERT INTO profiles (
        user_id, risk_tolerance, investment_horizon, investment_goal, 
        budget, monthly_contribution, tax_bracket
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [
        profile.user_id,
        profile.risk_tolerance,
        profile.investment_horizon,
        profile.investment_goal,
        profile.budget,
        profile.monthly_contribution,
        profile.tax_bracket
      ]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating profile:', error);
    throw error;
  }
}

export async function updateProfile(profile: Partial<Profile> & { user_id: string }): Promise<Profile | null> {
  try {
    // First, check if the profile exists
    const existingProfile = await getProfileByUserId(profile.user_id);
    
    if (!existingProfile) {
      // Create a new profile if it doesn't exist
      return createProfile({
        user_id: profile.user_id,
        risk_tolerance: profile.risk_tolerance || null,
        investment_horizon: profile.investment_horizon || null,
        investment_goal: profile.investment_goal || null,
        budget: profile.budget || null,
        monthly_contribution: profile.monthly_contribution || null,
        tax_bracket: profile.tax_bracket || null
      });
    }
    
    // Build the update query dynamically based on the fields provided
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (profile.risk_tolerance !== undefined) {
      updates.push(`risk_tolerance = $${paramIndex++}`);
      values.push(profile.risk_tolerance);
    }
    
    if (profile.investment_horizon !== undefined) {
      updates.push(`investment_horizon = $${paramIndex++}`);
      values.push(profile.investment_horizon);
    }
    
    if (profile.investment_goal !== undefined) {
      updates.push(`investment_goal = $${paramIndex++}`);
      values.push(profile.investment_goal);
    }
    
    if (profile.budget !== undefined) {
      updates.push(`budget = $${paramIndex++}`);
      values.push(profile.budget);
    }
    
    if (profile.monthly_contribution !== undefined) {
      updates.push(`monthly_contribution = $${paramIndex++}`);
      values.push(profile.monthly_contribution);
    }
    
    if (profile.tax_bracket !== undefined) {
      updates.push(`tax_bracket = $${paramIndex++}`);
      values.push(profile.tax_bracket);
    }
    
    // If no fields to update, return the existing profile
    if (updates.length === 0) {
      return existingProfile;
    }
    
    // Add user_id to values array
    values.push(profile.user_id);
    
    const result = await query(
      `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}