import {
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
import { v4 as uuidv4 } from 'uuid';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private cases: Map<number, Case> = new Map();
  private clients: Map<number, Client> = new Map();
  private hearings: Map<number, Hearing> = new Map();
  private activities: Map<number, Activity> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with test user
    this.users.set("test-user-id", {
      id: "test-user-id",
      email: "test@test.com",
      firstName: "Test",
      lastName: "User",
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      ...userData,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.users.set(userData.id, user);
    return user;
  }

  // Case operations
  async getCases(userId: string): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getCase(id: number): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getUpcomingHearingCases(userId: string, limit = 5): Promise<Case[]> {
    const today = new Date();
    return Array.from(this.cases.values())
      .filter(c => c.userId === userId && c.nextHearingDate && new Date(c.nextHearingDate) >= today)
      .sort((a, b) => new Date(a.nextHearingDate!).getTime() - new Date(b.nextHearingDate!).getTime())
      .slice(0, limit);
  }

  async searchCases(userId: string, query: string): Promise<Case[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.cases.values())
      .filter(c => 
        c.userId === userId && 
        (c.caseNumber.toLowerCase().includes(lowerQuery) || 
         c.title.toLowerCase().includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async filterCasesByStatus(userId: string, status: string): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.userId === userId && c.status === status)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async createCase(data: InsertCase & { userId: string }): Promise<Case> {
    const id = this.nextId++;
    const newCase: Case = {
      id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.cases.set(id, newCase);
    return newCase;
  }

  async updateCase(id: number, data: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = this.cases.get(id);
    if (!existingCase) return undefined;
    
    const updatedCase: Case = {
      ...existingCase,
      ...data,
      updatedAt: new Date()
    };
    this.cases.set(id, updatedCase);
    return updatedCase;
  }

  async deleteCase(id: number): Promise<boolean> {
    return this.cases.delete(id);
  }

  async getCasesByClient(clientId: number): Promise<Case[]> {
    return Array.from(this.cases.values())
      .filter(c => c.clientId === clientId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getCasesByStatuses(userId: string): Promise<{ status: string; count: number }[]> {
    const statusCounts = new Map<string, number>();
    Array.from(this.cases.values())
      .filter(c => c.userId === userId)
      .forEach(c => {
        statusCounts.set(c.status, (statusCounts.get(c.status) || 0) + 1);
      });
    
    return Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getRecentClients(userId: string, limit = 5): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async searchClients(userId: string, query: string): Promise<Client[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.clients.values())
      .filter(c => 
        c.userId === userId && 
        (c.name.toLowerCase().includes(lowerQuery) || 
         c.email?.toLowerCase().includes(lowerQuery) ||
         c.contactNumber?.includes(query))
      )
      .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime());
  }

  async createClient(data: InsertClient & { userId: string }): Promise<Client> {
    const id = this.nextId++;
    const newClient: Client = {
      id,
      clientUuid: uuidv4(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, data: Partial<InsertClient>): Promise<Client | undefined> {
    const existingClient = this.clients.get(id);
    if (!existingClient) return undefined;
    
    const updatedClient: Client = {
      ...existingClient,
      ...data,
      updatedAt: new Date()
    };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Hearing operations
  async getHearings(userId: string): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());
  }

  async getHearing(id: number): Promise<Hearing | undefined> {
    return this.hearings.get(id);
  }

  async getUpcomingHearings(userId: string, limit = 5): Promise<Hearing[]> {
    const today = new Date();
    return Array.from(this.hearings.values())
      .filter(h => h.userId === userId && new Date(h.hearingDate) >= today)
      .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime())
      .slice(0, limit);
  }

  async getHearingsByCase(caseId: number): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(h => h.caseId === caseId)
      .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());
  }

  async getHearingsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Hearing[]> {
    return Array.from(this.hearings.values())
      .filter(h => {
        const hearingDate = new Date(h.hearingDate);
        return h.userId === userId && hearingDate >= startDate && hearingDate <= endDate;
      })
      .sort((a, b) => new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime());
  }

  async createHearing(data: InsertHearing & { userId: string }): Promise<Hearing> {
    const id = this.nextId++;
    const newHearing: Hearing = {
      id,
      ...data,
      status: data.status ?? null,
      time: data.time ?? null,
      notes: data.notes ?? null,
      userId: data.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.hearings.set(id, newHearing);
    return newHearing;
  }

  async updateHearing(id: number, data: Partial<InsertHearing>): Promise<Hearing | undefined> {
    const existingHearing = this.hearings.get(id);
    if (!existingHearing) return undefined;
    
    const updatedHearing: Hearing = {
      ...existingHearing,
      ...data,
      updatedAt: new Date()
    };
    this.hearings.set(id, updatedHearing);
    return updatedHearing;
  }

  async deleteHearing(id: number): Promise<boolean> {
    return this.hearings.delete(id);
  }

  // Activity operations
  async getActivities(userId: string, limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createActivity(data: InsertActivity & { userId: string }): Promise<Activity> {
    const id = this.nextId++;
    const newActivity: Activity = {
      id,
      ...data,
      details: data.details ?? null,
      userId: data.userId ?? null,
      createdAt: new Date()
    };
    this.activities.set(id, newActivity);
    return newActivity;
  }

  // Dashboard operations
  async getDashboardStats(userId: string): Promise<{ 
    totalCases: number; 
    activeCases: number; 
    totalClients: number; 
    hearingsThisWeek: number;
  }> {
    const userCases = Array.from(this.cases.values()).filter(c => c.userId === userId);
    const userClients = Array.from(this.clients.values()).filter(c => c.userId === userId);
    const userHearings = Array.from(this.hearings.values()).filter(h => h.userId === userId);
    
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const hearingsThisWeek = userHearings.filter(h => {
      const hearingDate = new Date(h.hearingDate);
      return hearingDate >= today && hearingDate <= weekFromNow;
    }).length;

    return {
      totalCases: userCases.length,
      activeCases: userCases.filter(c => c.status === 'Active' || c.status === 'Scheduled').length,
      totalClients: userClients.length,
      hearingsThisWeek
    };
  }
}

export const storage = new MemStorage();