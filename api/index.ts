import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DatabaseStorage } from '../server/db-storage.js';
import { insertCaseSchema, insertClientSchema, insertHearingSchema } from '../shared/schema.js';
import { format } from 'date-fns';

// Use database storage for Vercel deployment
const storage = new DatabaseStorage();

import { db } from '../server/db.js';
import { sessions } from '../shared/schema.js';
import { eq, lt } from 'drizzle-orm';

function getSessionId(req: VercelRequest): string | null {
  return req.headers.cookie
    ?.split(';')
    .find(c => c.trim().startsWith('sessionId='))
    ?.split('=')[1] || null;
}

async function setSession(res: VercelResponse, userId: string): Promise<string> {
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

async function isAuthenticated(req: VercelRequest): Promise<{ userId: string } | null> {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse the path more reliably
  let path: string;
  try {
    const url = new URL(req.url!, `http://${req.headers.host || 'localhost'}`);
    path = url.pathname.replace(/^\/api\//, '');
  } catch (e) {
    // Fallback if URL parsing fails
    path = (req.url || '').replace(/^\/api\//, '');
  }
  
  console.log(`API Request: ${req.method} /${path}`, { 
    url: req.url, 
    headers: req.headers, 
    body: req.body, 
    query: req.query,
    env: process.env.NODE_ENV,
    dbUrl: process.env.DATABASE_URL ? 'Set' : 'Not Set'
  });

  try {
    // Ensure database connection is working
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set');
      return res.status(500).json({ message: 'Database configuration error' });
    }

    switch (path) {
      case 'login':
        return await handleLogin(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'auth/user':
        return await handleGetUser(req, res);
      case 'dashboard/stats':
        return await handleDashboardStats(req, res);
      case 'dashboard/case-statuses':
        return await handleCaseStatuses(req, res);
      case 'activities':
        return await handleActivities(req, res);
      case 'cases':
        return await handleCases(req, res);
      case 'clients':
        return await handleClients(req, res);
      case 'hearings':
        return await handleHearings(req, res);
      default:
        if (path.startsWith('cases/')) {
          return await handleCaseById(req, res, path);
        }
        if (path.startsWith('clients/')) {
          return await handleClientById(req, res, path);
        }
        if (path.startsWith('hearings/')) {
          return await handleHearingById(req, res, path);
        }
        console.log(`No handler found for path: ${path}`);
        return res.status(404).json({ message: `Not found: ${path}` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Auth handlers
async function handleLogin(req: VercelRequest, res: VercelResponse) {
  console.log('Login handler called:', { method: req.method, body: req.body });
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, passwordProvided: !!password });
    
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
      
      console.log('Test user credentials matched, upserting user...');
      
      // Upsert the user to ensure it exists
      await storage.upsertUser(testUser);
      
      console.log('User upserted, setting session...');
      
      await setSession(res, testUser.id);
      
      console.log('Session set, returning success response');
      
      return res.json({ success: true, user: testUser });
    }
    
    console.log('Invalid credentials provided');
    return res.status(401).json({ message: 'Invalid credentials' });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Login failed', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionId = getSessionId(req);
  if (sessionId) {
    // Delete session from database
    await db.delete(sessions).where(eq(sessions.sid, sessionId));
  }
  
  res.setHeader('Set-Cookie', 'sessionId=; HttpOnly; Path=/; Max-Age=0');
  res.json({ success: true });
}

async function handleGetUser(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await storage.getUser(auth.userId);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  res.json(user);
}

// Dashboard handlers
async function handleDashboardStats(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const stats = await storage.getDashboardStats(auth.userId);
  res.json(stats);
}

async function handleCaseStatuses(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const statuses = await storage.getCasesByStatuses(auth.userId);
  res.json(statuses);
}

async function handleActivities(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const activities = await storage.getActivities(auth.userId, limit);
  res.json(activities);
}

// Cases handlers
async function handleCases(req: VercelRequest, res: VercelResponse) {
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
}

async function handleCaseById(req: VercelRequest, res: VercelResponse, path: string) {
  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const caseId = parseInt(path.split('/')[1]);
  if (isNaN(caseId)) {
    return res.status(400).json({ message: 'Invalid case ID' });
  }

  if (req.method === 'GET') {
    const caseData = await storage.getCase(caseId);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (caseData.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    return res.json(caseData);
  }

  if (req.method === 'PUT') {
    const existingCase = await storage.getCase(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (existingCase.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const validatedData = insertCaseSchema.partial().parse(req.body);
    const updatedCase = await storage.updateCase(caseId, validatedData);
    
    await storage.createActivity({
      action: "Updated Case",
      details: `Updated case: ${updatedCase?.caseNumber}`,
      entityType: "case",
      entityId: caseId,
      userId: auth.userId,
    });
    
    return res.json(updatedCase);
  }

  if (req.method === 'DELETE') {
    const existingCase = await storage.getCase(caseId);
    if (!existingCase) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (existingCase.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await storage.deleteCase(caseId);
    
    await storage.createActivity({
      action: "Deleted Case",
      details: `Deleted case: ${existingCase.caseNumber}`,
      entityType: "case",
      entityId: caseId,
      userId: auth.userId,
    });
    
    return res.status(204).end();
  }

  res.status(405).json({ message: 'Method not allowed' });
}

// Clients handlers
async function handleClients(req: VercelRequest, res: VercelResponse) {
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
}

async function handleClientById(req: VercelRequest, res: VercelResponse, path: string) {
  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const clientId = parseInt(path.split('/')[1]);
  if (isNaN(clientId)) {
    return res.status(400).json({ message: 'Invalid client ID' });
  }

  if (req.method === 'GET') {
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    if (client.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const clientCases = await storage.getCasesByClient(clientId);
    return res.json({ client, cases: clientCases });
  }

  if (req.method === 'PUT') {
    const existingClient = await storage.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    if (existingClient.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const validatedData = insertClientSchema.partial().parse(req.body);
    const updatedClient = await storage.updateClient(clientId, validatedData);
    
    await storage.createActivity({
      action: "Updated Client",
      details: `Updated client: ${updatedClient?.name}`,
      entityType: "client",
      entityId: clientId,
      userId: auth.userId,
    });
    
    return res.json(updatedClient);
  }

  if (req.method === 'DELETE') {
    const existingClient = await storage.getClient(clientId);
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    if (existingClient.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await storage.deleteClient(clientId);
    
    await storage.createActivity({
      action: "Deleted Client",
      details: `Deleted client: ${existingClient.name}`,
      entityType: "client",
      entityId: clientId,
      userId: auth.userId,
    });
    
    return res.status(204).end();
  }

  res.status(405).json({ message: 'Method not allowed' });
}

// Hearings handlers
async function handleHearings(req: VercelRequest, res: VercelResponse) {
  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const caseId = req.query.caseId ? parseInt(req.query.caseId as string) : undefined;
    
    let hearings;
    if (caseId) {
      hearings = await storage.getHearingsByCase(caseId);
    } else {
      hearings = await storage.getHearings(auth.userId);
    }
    
    return res.json(hearings);
  }

  if (req.method === 'POST') {
    const validatedData = insertHearingSchema.parse(req.body);
    
    const caseData = await storage.getCase(validatedData.caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    if (caseData.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Ensure date persisted as YYYY-MM-DD (string)
    const normalized = {
      ...validatedData,
      hearingDate: new Date(validatedData.hearingDate).toISOString().slice(0, 10),
    } as any;
    const newHearing = await storage.createHearing({ ...normalized, userId: auth.userId });
    
    await storage.updateCase(validatedData.caseId, { 
      nextHearingDate: new Date(validatedData.hearingDate).toISOString().slice(0, 10),
      status: 'Scheduled'
    });
    
    await storage.createActivity({
      action: "Scheduled Hearing",
      details: `Scheduled hearing for case ${caseData.caseNumber} on ${format(new Date(validatedData.hearingDate), 'MMM dd, yyyy')}`,
      entityType: "hearing",
      entityId: newHearing.id,
      userId: auth.userId,
    });
    
    return res.status(201).json(newHearing);
  }

  res.status(405).json({ message: 'Method not allowed' });
}

async function handleHearingById(req: VercelRequest, res: VercelResponse, path: string) {
  const auth = await isAuthenticated(req);
  if (!auth) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const hearingId = parseInt(path.split('/')[1]);
  if (isNaN(hearingId)) {
    return res.status(400).json({ message: 'Invalid hearing ID' });
  }

  if (req.method === 'GET') {
    const hearing = await storage.getHearing(hearingId);
    
    if (!hearing) {
      return res.status(404).json({ message: 'Hearing not found' });
    }
    
    if (hearing.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    return res.json(hearing);
  }

  if (req.method === 'PUT') {
    const existingHearing = await storage.getHearing(hearingId);
    if (!existingHearing) {
      return res.status(404).json({ message: 'Hearing not found' });
    }
    
    if (existingHearing.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const validatedData = insertHearingSchema.partial().parse(req.body);
    const updatedHearing = await storage.updateHearing(hearingId, {
      ...validatedData,
      ...(validatedData.hearingDate
        ? { hearingDate: new Date(validatedData.hearingDate).toISOString().slice(0, 10) }
        : {}),
    } as any);
    
    if (validatedData.hearingDate) {
      await storage.updateCase(existingHearing.caseId, { 
        nextHearingDate: new Date(validatedData.hearingDate).toISOString().slice(0, 10)
      });
    }
    
    await storage.createActivity({
      action: "Updated Hearing",
      details: `Updated hearing for case ID ${existingHearing.caseId}`,
      entityType: "hearing",
      entityId: hearingId,
      userId: auth.userId,
    });
    
    return res.json(updatedHearing);
  }

  if (req.method === 'DELETE') {
    const existingHearing = await storage.getHearing(hearingId);
    if (!existingHearing) {
      return res.status(404).json({ message: 'Hearing not found' });
    }
    
    if (existingHearing.userId !== auth.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await storage.deleteHearing(hearingId);
    
    await storage.createActivity({
      action: "Deleted Hearing",
      details: `Deleted hearing for case ID ${existingHearing.caseId}`,
      entityType: "hearing",
      entityId: hearingId,
      userId: auth.userId,
    });
    
    return res.status(204).end();
  }

  res.status(405).json({ message: 'Method not allowed' });
}
