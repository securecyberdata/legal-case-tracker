import { db } from "./db";
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
import { eq, desc, like, or, and, gte, lte, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values({
        ...userData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return result[0];
  }

  // Case operations
  async getCases(userId: string): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(eq(cases.userId, userId))
      .orderBy(desc(cases.updatedAt));
  }

  async getCase(id: number): Promise<Case | undefined> {
    const result = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
    return result[0];
  }

  async getUpcomingHearingCases(userId: string, limit = 5): Promise<Case[]> {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    return await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          gte(cases.nextHearingDate, todayStr)
        )
      )
      .orderBy(cases.nextHearingDate)
      .limit(limit);
  }

  async searchCases(userId: string, query: string): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          or(
            like(cases.caseNumber, `%${query}%`),
            like(cases.title, `%${query}%`)
          )
        )
      )
      .orderBy(desc(cases.updatedAt));
  }

  async filterCasesByStatus(userId: string, status: string): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          eq(cases.status, status as any)
        )
      )
      .orderBy(desc(cases.updatedAt));
  }

  async createCase(data: InsertCase & { userId: string }): Promise<Case> {
    const result = await db
      .insert(cases)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async updateCase(id: number, data: Partial<InsertCase>): Promise<Case | undefined> {
    const result = await db
      .update(cases)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(cases.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCase(id: number): Promise<boolean> {
    const result = await db.delete(cases).where(eq(cases.id, id));
    return result.rowCount > 0;
  }

  async getCasesByClient(clientId: number): Promise<Case[]> {
    return await db
      .select()
      .from(cases)
      .where(eq(cases.clientId, clientId))
      .orderBy(desc(cases.updatedAt));
  }

  async getCasesByStatuses(userId: string): Promise<{ status: string; count: number }[]> {
    const result = await db
      .select({
        status: cases.status,
        count: sql<number>`count(*)`.mapWith(Number)
      })
      .from(cases)
      .where(eq(cases.userId, userId))
      .groupBy(cases.status);
    
    return result;
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.updatedAt));
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return result[0];
  }

  async getRecentClients(userId: string, limit = 5): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.createdAt))
      .limit(limit);
  }

  async searchClients(userId: string, query: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.userId, userId),
          or(
            like(clients.name, `%${query}%`),
            like(clients.email, `%${query}%`),
            like(clients.contactNumber, `%${query}%`)
          )
        )
      )
      .orderBy(desc(clients.updatedAt));
  }

  async createClient(data: InsertClient & { userId: string }): Promise<Client> {
    const result = await db
      .insert(clients)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db
      .update(clients)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(clients.id, id))
      .returning();
    
    return result[0];
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  // Hearing operations
  async getHearings(userId: string): Promise<Hearing[]> {
    return await db
      .select()
      .from(hearings)
      .where(eq(hearings.userId, userId))
      .orderBy(hearings.hearingDate);
  }

  async getHearing(id: number): Promise<Hearing | undefined> {
    const result = await db.select().from(hearings).where(eq(hearings.id, id)).limit(1);
    return result[0];
  }

  async getUpcomingHearings(userId: string, limit = 5): Promise<Hearing[]> {
    const today = new Date();
    return await db
      .select()
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          gte(hearings.hearingDate, today)
        )
      )
      .orderBy(hearings.hearingDate)
      .limit(limit);
  }

  async getHearingsByCase(caseId: number): Promise<Hearing[]> {
    return await db
      .select()
      .from(hearings)
      .where(eq(hearings.caseId, caseId))
      .orderBy(hearings.hearingDate);
  }

  async getHearingsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Hearing[]> {
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    return await db
      .select()
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          gte(hearings.hearingDate, startStr),
          lte(hearings.hearingDate, endStr)
        )
      )
      .orderBy(hearings.hearingDate);
  }

  async createHearing(data: InsertHearing & { userId: string }): Promise<Hearing> {
    const result = await db
      .insert(hearings)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  async updateHearing(id: number, data: Partial<InsertHearing>): Promise<Hearing | undefined> {
    const result = await db
      .update(hearings)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(hearings.id, id))
      .returning();
    
    return result[0];
  }

  async deleteHearing(id: number): Promise<boolean> {
    const result = await db.delete(hearings).where(eq(hearings.id, id));
    return result.rowCount > 0;
  }

  // Activity operations
  async getActivities(userId: string, limit = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(data: InsertActivity & { userId: string }): Promise<Activity> {
    const result = await db
      .insert(activities)
      .values({
        ...data,
        createdAt: new Date()
      })
      .returning();
    
    return result[0];
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<{ 
    totalCases: number; 
    activeCases: number; 
    totalClients: number; 
    hearingsThisWeek: number;
  }> {
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().slice(0, 10);
    const weekFromNowStr = weekFromNow.toISOString().slice(0, 10);

    const [totalCasesResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(cases)
      .where(eq(cases.userId, userId));

    const [activeCasesResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(cases)
      .where(
        and(
          eq(cases.userId, userId),
          or(
            eq(cases.status, 'Active'),
            eq(cases.status, 'Scheduled')
          )
        )
      );

    const [totalClientsResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(clients)
      .where(eq(clients.userId, userId));

    const [hearingsThisWeekResult] = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(hearings)
      .where(
        and(
          eq(hearings.userId, userId),
          gte(hearings.hearingDate, todayStr),
          lte(hearings.hearingDate, weekFromNowStr)
        )
      );

    return {
      totalCases: totalCasesResult.count,
      activeCases: activeCasesResult.count,
      totalClients: totalClientsResult.count,
      hearingsThisWeek: hearingsThisWeekResult.count
    };
  }
}
