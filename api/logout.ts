import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db';
import { sessions } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { setCorsHeaders, handleOptions, getSessionId } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const sessionId = getSessionId(req);
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.sid, sessionId));
    }
    
    res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
