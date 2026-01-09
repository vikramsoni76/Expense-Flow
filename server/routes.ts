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
    const expenses = await storage.getExpenses(req.user!.id);
    res.json(expenses);
  });

  app.post(api.expenses.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.expenses.create.input.parse(req.body);
      const expense = await storage.createExpense(req.user!.id, input);
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
      req.user!.id, 
      startDate as string, 
      endDate as string
    );

    try {
      const fields = ['date', 'description', 'category', 'amount', 'travelMode', 'startLocation', 'endLocation', 'customerName', 'status'];
      const parser = new Parser({ fields });
      const csv = parser.parse(expenses);
      
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
