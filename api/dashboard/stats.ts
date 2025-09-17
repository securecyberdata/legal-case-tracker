import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseStorage } from '../../server/db-storage';
import { setCorsHeaders, handleOptions, isAuthenticated } from '../_lib/auth';

const storage = new DatabaseStorage();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const auth = await isAuthenticated(req);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const stats = await storage.getDashboardStats(auth.userId);
    res.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
