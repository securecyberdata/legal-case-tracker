import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseStorage } from '../server/db-storage';
import { insertCaseSchema } from '../shared/schema';
import { setCorsHeaders, handleOptions, isAuthenticated } from './_lib/auth';

const storage = new DatabaseStorage();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return handleOptions(res);
  }

  try {
    const auth = await isAuthenticated(req);
    if (!auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
      const search = req.query.search as string;
      const status = req.query.status as string;

      let cases;
      if (search) {
        cases = await storage.searchCases(auth.userId, search);
      } else if (status) {
        cases = await storage.filterCasesByStatus(auth.userId, status);
      } else {
        cases = await storage.getCases(auth.userId);
      }
      
      return res.json(cases);
    }

    if (req.method === 'POST') {
      const validatedData = insertCaseSchema.parse(req.body);
      const newCase = await storage.createCase({ ...validatedData, userId: auth.userId });
      
      await storage.createActivity({
        action: "Created Case",
        details: `Created new case: ${newCase.caseNumber} - ${newCase.title}`,
        entityType: "case",
        entityId: newCase.id,
        userId: auth.userId,
      });
      
      return res.status(201).json(newCase);
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Cases API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
