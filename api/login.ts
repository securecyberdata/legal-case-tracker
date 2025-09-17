import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseStorage } from '../server/db-storage';
import { setCorsHeaders, handleOptions, setSession } from './_lib/auth';

const storage = new DatabaseStorage();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email });
    
    if (email === 'test@test.com' && password === 'test123') {
      // Create or get test user
      const testUser = {
        id: 'test-user-id',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Upsert the user to ensure it exists
      await storage.upsertUser(testUser);
      
      await setSession(res, testUser.id);
      return res.json({ success: true, user: testUser });
    }
    
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
