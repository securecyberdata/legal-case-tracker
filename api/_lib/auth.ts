import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db';
import { sessions } from '../../shared/schema';
import { eq, lt } from 'drizzle-orm';

export function getSessionId(req: VercelRequest): string | null {
  return req.headers.cookie
    ?.split(';')
    .find(c => c.trim().startsWith('sessionId='))
    ?.split('=')[1] || null;
}

export async function setSession(res: VercelResponse, userId: string): Promise<string> {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // Store session in database
  await db.insert(sessions).values({
    sid: sessionId,
    sess: { userId },
    expire: expires
  }).onConflictDoUpdate({
    target: sessions.sid,
    set: {
      sess: { userId },
      expire: expires
    }
  });
  
  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax`);
  return sessionId;
}

export async function isAuthenticated(req: VercelRequest): Promise<{ userId: string } | null> {
  const sessionId = getSessionId(req);
  if (!sessionId) return null;
  
  // Clean up expired sessions
  await db.delete(sessions).where(lt(sessions.expire, new Date()));
  
  // Get session from database
  const sessionResult = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sid, sessionId))
    .limit(1);
  
  const session = sessionResult[0];
  if (!session || session.expire < new Date()) {
    if (session) {
      await db.delete(sessions).where(eq(sessions.sid, sessionId));
    }
    return null;
  }
  
  return { userId: (session.sess as any).userId };
}

export function setCorsHeaders(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
}

export function handleOptions(res: VercelResponse) {
  res.status(200).end();
}
