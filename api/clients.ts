import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseStorage } from '../server/db-storage';
import { insertClientSchema } from '../shared/schema';
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
      
      let clients;
      if (search) {
        clients = await storage.searchClients(auth.userId, search);
      } else {
        clients = await storage.getClients(auth.userId);
      }
      
      return res.json(clients);
    }

    if (req.method === 'POST') {
      const validatedData = insertClientSchema.parse(req.body);
      const newClient = await storage.createClient({ ...validatedData, userId: auth.userId });
      
      await storage.createActivity({
        action: "Added Client",
        details: `Added new client: ${newClient.name}`,
        entityType: "client",
        entityId: newClient.id,
        userId: auth.userId,
      });
      
      return res.status(201).json(newClient);
    }

    res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Clients API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
