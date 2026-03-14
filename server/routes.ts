import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";
import { Parser } from "json2csv";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Middleware to ensure authentication for expense routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    next();
  };

  app.get(api.expenses.list.path, requireAuth, async (req, res) => {
    const expenses = await storage.getExpenses((req.user as any).id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    try {
      const bodySchema = api.expenses.create.input.extend({
        amount: z.coerce.string(),
      });
      const input = bodySchema.parse(req.body);
      const expense = await storage.createExpense((req.user as any).id, input as any);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.expenses.update.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    const expense = await storage.updateExpense(id, req.body);
    if (!expense) return res.status(404).send("Expense not found");
    res.json(expense);
  });

  app.delete(api.expenses.delete.path, requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteExpense(id);
    res.sendStatus(204);
  });

  app.get(api.reports.csv.path, requireAuth, async (req, res) => {
    const { startDate, endDate } = req.query;
    const expenses = await storage.getExpensesByDateRange(
      (req.user as any).id, 
      startDate as string, 
      endDate as string
    );

    try {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const yy = String(d.getUTCFullYear()).slice(-2);
        return `${dd}/${mm}/${yy}`;
      };

      const rows = expenses.map(e => ({
        Date: formatDate(e.date),
        'Customer Name': e.customerName || '',
        Description: e.description || '',
        'Start Location': e.startLocation || '',
        'End Location': e.endLocation || '',
        Category: e.category,
        Mode: e.travelMode || '',
        'Amount (INR)': Number(e.amount).toFixed(2),
      }));

      const fields = ['Date', 'Customer Name', 'Description', 'Start Location', 'End Location', 'Category', 'Mode', 'Amount (INR)'];
      const parser = new Parser({ fields });
      const csv = parser.parse(rows);
      
      res.header('Content-Type', 'text/csv');
      res.attachment('expenses.csv');
      return res.send(csv);
    } catch (err) {
      res.status(500).json({ message: "Error generating CSV" });
    }
  });

  // Seed data function (simple check)
  async function seed() {
    // Check if any users exist, if not create a demo user
    const demoUsername = "demo";
    const existing = await storage.getUserByUsername(demoUsername);
    if (!existing) {
      // Create demo user via auth route logic or direct storage if we had hashing helper exposed
      // Since we don't have hashing helper exposed easily here without importing, we'll skip auto-seeding user
      // But we can console log instructions
      console.log("Database initialized. Create a user to start.");
    }
  }
  
  seed();

  return httpServer;
}
