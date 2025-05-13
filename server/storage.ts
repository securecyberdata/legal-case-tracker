import {
  users,
  cases,
  clients,
  hearings,
  activities,
  type User,
  type UpsertUser,
  type Case,
  type InsertCase,
  type Client,
  type InsertClient,
  type Hearing,
  type InsertHearing,
  type Activity,
  type InsertActivity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, desc, sql, like, ilike } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Case operations
  getCases(userId: string): Promise<Case[]>;
  getCase(id: number): Promise<Case | undefined>;
  getUpcomingHearingCases(userId: string, limit?: number): Promise<Case[]>;
  searchCases(userId: string, query: string): Promise<Case[]>;
  filterCasesByStatus(userId: string, status: string): Promise<Case[]>;
  createCase(data: InsertCase & { userId: string }): Promise<Case>;
  updateCase(id: number, data: Partial<InsertCase>): Promise<Case | undefined>;
  deleteCase(id: number): Promise<boolean>;
  getCasesByClient(clientId: number): Promise<Case[]>;
  getCasesByStatuses(userId: string): Promise<{ status: string; count: number }[]>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  getRecentClients(userId: string, limit?: number): Promise<Client[]>;
  searchClients(userId: string, query: string): Promise<Client[]>;
  createClient(data: InsertClient & { userId: string }): Promise<Client>;
  updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Hearing operations
  getHearings(userId: string): Promise<Hearing[]>;
  getHearing(id: number): Promise<Hearing | undefined>;
  getUpcomingHearings(userId: string, limit?: number): Promise<Hearing[]>;
  getHearingsByCase(caseId: number): Promise<Hearing[]>;
  getHearingsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Hearing[]>;
  createHearing(data: InsertHearing & { userId: string }): Promise<Hearing>;
  updateHearing(id: number, data: Partial<InsertHearing>): Promise<Hearing | undefined>;
  deleteHearing(id: number): Promise<boolean>;
  
  // Activity operations
  getActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(data: InsertActivity & { userId: string }): Promise<Activity>;
  
  // Dashboard operations
  getDashboardStats(userId: string): Promise<{ 
    totalCases: number; 
    activeCases: number; 
    totalClients: number; 
    hearingsThisWeek: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Case operations
  async getCases(userId: string): Promise<Case[]> {
    return db.select().from(cases).where(eq(cases.userId, userId)).orderBy(desc(cases.updatedAt));
  }

  async getCase(id: number): Promise<Case | undefined> {
    const [caseData] = await db.select().from(cases).where(eq(cases.id, id));
    return caseData;
  }

  async getUpcomingHearingCases(userId: string, limit = 5): Promise<Case[]> {
    return db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          sql`${cases.nextHearingDate} IS NOT NULL AND ${cases.nextHearingDate} >= CURRENT_DATE`
        )
      )
      .orderBy(cases.nextHearingDate)
      .limit(limit);
  }

  async searchCases(userId: string, query: string): Promise<Case[]> {
    return db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          sql`(${cases.caseNumber} ILIKE ${`%${query}%`} OR ${cases.title} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(cases.updatedAt));
  }

  async filterCasesByStatus(userId: string, status: string): Promise<Case[]> {
    return db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          eq(cases.status, status)
        )
      )
      .orderBy(desc(cases.updatedAt));
  }

  async createCase(data: InsertCase & { userId: string }): Promise<Case> {
    const [newCase] = await db.insert(cases).values(data).returning();
    return newCase;
  }

  async updateCase(id: number, data: Partial<InsertCase>): Promise<Case | undefined> {
    const [updatedCase] = await db
      .update(cases)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(cases.id, id))
      .returning();
    return updatedCase;
  }

  async deleteCase(id: number): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return result.count > 0;
  }

  async getCasesByClient(clientId: number): Promise<Case[]> {
    return db
      .select()
      .from(cases)
      .where(eq(cases.clientId, clientId))
      .orderBy(desc(cases.updatedAt));
  }

  async getCasesByStatuses(userId: string): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: cases.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(cases)
      .where(eq(cases.userId, userId))
      .groupBy(cases.status);
    
    return result;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.updatedAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getRecentClients(userId: string, limit = 4): Promise<Client[]> {
    return db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.updatedAt))
      .limit(limit);
  }

  async searchClients(userId: string, query: string): Promise<Client[]> {
    return db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          sql`(${clients.name} ILIKE ${`%${query}%`} OR ${clients.email} ILIKE ${`%${query}%`} OR ${clients.contactNumber} ILIKE ${`%${query}%`})`
        )
      )
      .orderBy(desc(clients.updatedAt));
  }

  async createClient(data: InsertClient & { userId: string }): Promise<Client> {
    const [newClient] = await db.insert(clients).values(data).returning();
    return newClient;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.count > 0;
  }

  // Hearing operations
  async getHearings(userId: string): Promise<Hearing[]> {
    return db.select().from(hearings).where(eq(hearings.userId, userId)).orderBy(hearings.hearingDate);
  }

  async getHearing(id: number): Promise<Hearing | undefined> {
    const [hearing] = await db.select().from(hearings).where(eq(hearings.id, id));
    return hearing;
  }

  async getUpcomingHearings(userId: string, limit = 5): Promise<Hearing[]> {
    return db
      .select()
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          gte(hearings.hearingDate, new Date())
        )
      )
      .orderBy(hearings.hearingDate)
      .limit(limit);
  }

  async getHearingsByCase(caseId: number): Promise<Hearing[]> {
    return db
      .select()
      .from(hearings)
      .where(eq(hearings.caseId, caseId))
      .orderBy(hearings.hearingDate);
  }

  async getHearingsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Hearing[]> {
    return db
      .select()
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          sql`${hearings.hearingDate} >= ${startDate} AND ${hearings.hearingDate} <= ${endDate}`
        )
      )
      .orderBy(hearings.hearingDate);
  }

  async createHearing(data: InsertHearing & { userId: string }): Promise<Hearing> {
    const [newHearing] = await db.insert(hearings).values(data).returning();
    return newHearing;
  }

  async updateHearing(id: number, data: Partial<InsertHearing>): Promise<Hearing | undefined> {
    const [updatedHearing] = await db
      .update(hearings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(hearings.id, id))
      .returning();
    return updatedHearing;
  }

  async deleteHearing(id: number): Promise<boolean> {
    const result = await db.delete(hearings).where(eq(hearings.id, id));
    return result.count > 0;
  }

  // Activity operations
  async getActivities(userId: string, limit = 10): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(data: InsertActivity & { userId: string }): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(data).returning();
    return newActivity;
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<{
    totalCases: number;
    activeCases: number;
    totalClients: number;
    hearingsThisWeek: number;
  }> {
    // Get total cases
    const [totalCasesResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cases)
      .where(eq(cases.userId, userId));
    
    // Get active cases
    const [activeCasesResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cases)
      .where(and(eq(cases.userId, userId), eq(cases.status, 'Active')));
    
    // Get total clients
    const [totalClientsResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(clients)
      .where(eq(clients.userId, userId));
    
    // Get hearings this week
    const today = new Date();
    const endOfWeek = new Date();
    endOfWeek.setDate(today.getDate() + 7);
    
    const [hearingsThisWeekResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          sql`${hearings.hearingDate} >= CURRENT_DATE AND ${hearings.hearingDate} <= ${endOfWeek}`
        )
      );
    
    return {
      totalCases: totalCasesResult.count,
      activeCases: activeCasesResult.count,
      totalClients: totalClientsResult.count,
      hearingsThisWeek: hearingsThisWeekResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
