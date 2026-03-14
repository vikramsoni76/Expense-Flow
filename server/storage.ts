import { db } from "./db";
import { users, expenses, type User, type InsertUser, type Expense, type InsertExpense } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export type ExpenseWithUser = Expense & { username: string };

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  setUserAdmin(id: number, isAdmin: boolean): Promise<void>;

  getExpenses(userId: number): Promise<Expense[]>;
  getAllExpenses(): Promise<ExpenseWithUser[]>;
  createExpense(userId: number, expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<void>;
  getExpensesByDateRange(userId: number, startDate?: string, endDate?: string): Promise<Expense[]>;

  resetAllData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async setUserAdmin(id: number, isAdmin: boolean): Promise<void> {
    await db.update(users).set({ isAdmin }).where(eq(users.id, id));
  }

  async resetAllData(): Promise<void> {
    await db.delete(expenses);
    await db.delete(users).where(eq(users.isAdmin, false));
  }

  async getExpenses(userId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.userId, userId));
  }

  async getAllExpenses(): Promise<ExpenseWithUser[]> {
    const rows = await db
      .select({
        id: expenses.id,
        userId: expenses.userId,
        date: expenses.date,
        description: expenses.description,
        startLocation: expenses.startLocation,
        endLocation: expenses.endLocation,
        customerName: expenses.customerName,
        travelMode: expenses.travelMode,
        amount: expenses.amount,
        category: expenses.category,
        status: expenses.status,
        googleSheetRowId: expenses.googleSheetRowId,
        createdAt: expenses.createdAt,
        username: users.username,
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .orderBy(expenses.createdAt);
    return rows.map(r => ({ ...r, username: r.username ?? 'Unknown' }));
  }

  async createExpense(userId: number, expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values({ ...expense, userId }).returning();
    return newExpense;
  }

  async updateExpense(id: number, updates: Partial<Expense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(updates).where(eq(expenses.id, id)).returning();
    return updated;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getExpensesByDateRange(userId: number, startDate?: string, endDate?: string): Promise<Expense[]> {
    let query = db.select().from(expenses).where(eq(expenses.userId, userId));
    
    if (startDate) {
      query = db.select().from(expenses).where(and(eq(expenses.userId, userId), gte(expenses.date, startDate)));
    }
    
    if (endDate) {
      // Re-apply startDate filter if it exists, or just use endDate
      // This is a simplification, ideally we chain .where()
      const conditions = [eq(expenses.userId, userId)];
      if (startDate) conditions.push(gte(expenses.date, startDate));
      if (endDate) conditions.push(lte(expenses.date, endDate));
      
      return await db.select().from(expenses).where(and(...conditions));
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();
