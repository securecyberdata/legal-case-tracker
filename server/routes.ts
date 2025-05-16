import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, upsertUser } from "./replitAuth";
import { insertCaseSchema, insertClientSchema, insertHearingSchema, insertActivitySchema } from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        // Create the user if they don't exist yet (first login)
        if (req.user.claims) {
          await upsertUser(req.user.claims);
          const newUser = await storage.getUser(userId);
          return res.json(newUser);
        } else {
          return res.status(404).json({ message: "User not found and couldn't be created" });
        }
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Case status distribution
  app.get('/api/dashboard/case-statuses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const statuses = await storage.getCasesByStatuses(userId);
      res.json(statuses);
    } catch (error) {
      console.error("Error fetching case statuses:", error);
      res.status(500).json({ message: "Failed to fetch case statuses" });
    }
  });

  // Recent activities
  app.get('/api/activities', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Cases API
  app.get('/api/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      const status = req.query.status as string;

      let cases;
      if (search) {
        cases = await storage.searchCases(userId, search);
      } else if (status) {
        cases = await storage.filterCasesByStatus(userId, status);
      } else {
        cases = await storage.getCases(userId);
      }
      
      res.json(cases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      res.status(500).json({ message: "Failed to fetch cases" });
    }
  });

  app.get('/api/cases/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const cases = await storage.getUpcomingHearingCases(userId, limit);
      res.json(cases);
    } catch (error) {
      console.error("Error fetching upcoming cases:", error);
      res.status(500).json({ message: "Failed to fetch upcoming cases" });
    }
  });

  app.get('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const caseData = await storage.getCase(caseId);
      
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (caseData.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(caseData);
    } catch (error) {
      console.error("Error fetching case:", error);
      res.status(500).json({ message: "Failed to fetch case" });
    }
  });

  app.post('/api/cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCaseSchema.parse(req.body);
      
      const newCase = await storage.createCase({ ...validatedData, userId });
      
      // Log activity
      await storage.createActivity({
        action: "Created Case",
        details: `Created new case: ${newCase.caseNumber} - ${newCase.title}`,
        entityType: "case",
        entityId: newCase.id,
        userId,
      });
      
      res.status(201).json(newCase);
    } catch (error) {
      console.error("Error creating case:", error);
      res.status(400).json({ message: "Failed to create case", error });
    }
  });

  app.put('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingCase = await storage.getCase(caseId);
      if (!existingCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (existingCase.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validatedData = insertCaseSchema.partial().parse(req.body);
      const updatedCase = await storage.updateCase(caseId, validatedData);
      
      // Log activity
      await storage.createActivity({
        action: "Updated Case",
        details: `Updated case: ${updatedCase?.caseNumber}`,
        entityType: "case",
        entityId: caseId,
        userId,
      });
      
      res.json(updatedCase);
    } catch (error) {
      console.error("Error updating case:", error);
      res.status(400).json({ message: "Failed to update case", error });
    }
  });

  app.delete('/api/cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const caseId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingCase = await storage.getCase(caseId);
      if (!existingCase) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (existingCase.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteCase(caseId);
      
      // Log activity
      await storage.createActivity({
        action: "Deleted Case",
        details: `Deleted case: ${existingCase.caseNumber}`,
        entityType: "case",
        entityId: caseId,
        userId,
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting case:", error);
      res.status(500).json({ message: "Failed to delete case" });
    }
  });

  // Clients API
  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const search = req.query.search as string;
      
      let clients;
      if (search) {
        clients = await storage.searchClients(userId, search);
      } else {
        clients = await storage.getClients(userId);
      }
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get('/api/clients/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      const clients = await storage.getRecentClients(userId, limit);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching recent clients:", error);
      res.status(500).json({ message: "Failed to fetch recent clients" });
    }
  });

  app.get('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (client.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Get client's cases
      const clientCases = await storage.getCasesByClient(clientId);
      
      res.json({ client, cases: clientCases });
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertClientSchema.parse(req.body);
      
      const newClient = await storage.createClient({ ...validatedData, userId });
      
      // Log activity
      await storage.createActivity({
        action: "Added Client",
        details: `Added new client: ${newClient.name}`,
        entityType: "client",
        entityId: newClient.id,
        userId,
      });
      
      res.status(201).json(newClient);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: "Failed to create client", error });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (existingClient.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validatedData = insertClientSchema.partial().parse(req.body);
      const updatedClient = await storage.updateClient(clientId, validatedData);
      
      // Log activity
      await storage.createActivity({
        action: "Updated Client",
        details: `Updated client: ${updatedClient?.name}`,
        entityType: "client",
        entityId: clientId,
        userId,
      });
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(400).json({ message: "Failed to update client", error });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (existingClient.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteClient(clientId);
      
      // Log activity
      await storage.createActivity({
        action: "Deleted Client",
        details: `Deleted client: ${existingClient.name}`,
        entityType: "client",
        entityId: clientId,
        userId,
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Hearings API
  app.get('/api/hearings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const caseId = req.query.caseId ? parseInt(req.query.caseId as string) : undefined;
      
      let hearings;
      if (caseId) {
        hearings = await storage.getHearingsByCase(caseId);
      } else {
        hearings = await storage.getHearings(userId);
      }
      
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching hearings:", error);
      res.status(500).json({ message: "Failed to fetch hearings" });
    }
  });

  app.get('/api/hearings/upcoming', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const hearings = await storage.getUpcomingHearings(userId, limit);
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching upcoming hearings:", error);
      res.status(500).json({ message: "Failed to fetch upcoming hearings" });
    }
  });

  app.get('/api/hearings/calendar', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const startDate = req.query.start ? new Date(req.query.start as string) : new Date();
      const endDate = req.query.end ? new Date(req.query.end as string) : new Date();
      
      // Default to month range if no dates provided
      if (!req.query.start && !req.query.end) {
        startDate.setDate(1); // First day of month
        endDate.setMonth(endDate.getMonth() + 1, 0); // Last day of month
      }
      
      const hearings = await storage.getHearingsByDateRange(userId, startDate, endDate);
      res.json(hearings);
    } catch (error) {
      console.error("Error fetching calendar hearings:", error);
      res.status(500).json({ message: "Failed to fetch calendar hearings" });
    }
  });

  app.get('/api/hearings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const hearingId = parseInt(req.params.id);
      const hearing = await storage.getHearing(hearingId);
      
      if (!hearing) {
        return res.status(404).json({ message: "Hearing not found" });
      }
      
      if (hearing.userId !== req.user.claims.sub) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      res.json(hearing);
    } catch (error) {
      console.error("Error fetching hearing:", error);
      res.status(500).json({ message: "Failed to fetch hearing" });
    }
  });

  app.post('/api/hearings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertHearingSchema.parse(req.body);
      
      // Verify case ownership
      const caseData = await storage.getCase(validatedData.caseId);
      if (!caseData) {
        return res.status(404).json({ message: "Case not found" });
      }
      
      if (caseData.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const newHearing = await storage.createHearing({ ...validatedData, userId });
      
      // Update case with next hearing date
      await storage.updateCase(validatedData.caseId, { 
        nextHearingDate: new Date(validatedData.hearingDate),
        status: 'Scheduled'
      });
      
      // Log activity
      await storage.createActivity({
        action: "Scheduled Hearing",
        details: `Scheduled hearing for case ${caseData.caseNumber} on ${format(new Date(validatedData.hearingDate), 'MMM dd, yyyy')}`,
        entityType: "hearing",
        entityId: newHearing.id,
        userId,
      });
      
      res.status(201).json(newHearing);
    } catch (error) {
      console.error("Error creating hearing:", error);
      res.status(400).json({ message: "Failed to create hearing", error });
    }
  });

  app.put('/api/hearings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const hearingId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingHearing = await storage.getHearing(hearingId);
      if (!existingHearing) {
        return res.status(404).json({ message: "Hearing not found" });
      }
      
      if (existingHearing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const validatedData = insertHearingSchema.partial().parse(req.body);
      const updatedHearing = await storage.updateHearing(hearingId, validatedData);
      
      // Update case with next hearing date if date changed
      if (validatedData.hearingDate) {
        await storage.updateCase(existingHearing.caseId, { 
          nextHearingDate: new Date(validatedData.hearingDate)
        });
      }
      
      // Log activity
      await storage.createActivity({
        action: "Updated Hearing",
        details: `Updated hearing for case ID ${existingHearing.caseId}`,
        entityType: "hearing",
        entityId: hearingId,
        userId,
      });
      
      res.json(updatedHearing);
    } catch (error) {
      console.error("Error updating hearing:", error);
      res.status(400).json({ message: "Failed to update hearing", error });
    }
  });

  app.delete('/api/hearings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const hearingId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      // Verify ownership
      const existingHearing = await storage.getHearing(hearingId);
      if (!existingHearing) {
        return res.status(404).json({ message: "Hearing not found" });
      }
      
      if (existingHearing.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await storage.deleteHearing(hearingId);
      
      // Log activity
      await storage.createActivity({
        action: "Deleted Hearing",
        details: `Deleted hearing for case ID ${existingHearing.caseId}`,
        entityType: "hearing",
        entityId: hearingId,
        userId,
      });
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting hearing:", error);
      res.status(500).json({ message: "Failed to delete hearing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
