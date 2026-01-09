import { pgTable, text, serial, integer, boolean, timestamp, numeric, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  startLocation: text("start_location"),
  endLocation: text("end_location"),
  customerName: text("customer_name"),
  travelMode: text("travel_mode"), // Enum: Air, Taxi, Auto, Car, Bus, Metro, Other
  amount: numeric("amount").notNull(),
  category: text("category").notNull(), // Travel, Food, Other
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  googleSheetRowId: integer("google_sheet_row_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users);
export const insertExpenseSchema = createInsertSchema(expenses).omit({ 
  id: true, 
  userId: true,
  createdAt: true,
  status: true,
  googleSheetRowId: true 
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
