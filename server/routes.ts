import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";
import { Parser } from "json2csv";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

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

  // Admin middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    if (!(req.user as any).isAdmin) return res.status(403).send("Forbidden");
    next();
  };

  // Admin: get all expenses from all users
  app.get('/api/admin/expenses', requireAdmin, async (req, res) => {
    const expenses = await storage.getAllExpenses();
    res.json(expenses);
  });

  // Admin: approve or reject an expense
  app.patch('/api/admin/expenses/:id', requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const expense = await storage.updateExpense(id, { status });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  });

  // Admin: CSV report of all users' expenses
  app.get('/api/admin/reports/csv', requireAdmin, async (req, res) => {
    const expenses = await storage.getAllExpenses();
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
        Employee: e.username,
        'Customer Name': e.customerName || '',
        Description: e.description || '',
        'Start Location': e.startLocation || '',
        'End Location': e.endLocation || '',
        Category: e.category,
        Mode: e.travelMode || '',
        'Amount (INR)': Number(e.amount).toFixed(2),
        Status: e.status,
      }));
      const { Parser } = await import('json2csv');
      const parser = new Parser({ fields: ['Date', 'Employee', 'Customer Name', 'Description', 'Start Location', 'End Location', 'Category', 'Mode', 'Amount (INR)', 'Status'] });
      const csv = parser.parse(rows);
      res.header('Content-Type', 'text/csv');
      res.attachment('all_expenses_report.csv');
      return res.send(csv);
    } catch (err) {
      res.status(500).json({ message: 'Error generating CSV' });
    }
  });

  // Admin: full JSON backup of all data
  app.get('/api/admin/backup', requireAdmin, async (req, res) => {
    const allExpenses = await storage.getAllExpenses();
    const backup = {
      exportedAt: new Date().toISOString(),
      totalExpenses: allExpenses.length,
      expenses: allExpenses,
    };
    res.header('Content-Type', 'application/json');
    res.attachment(`expense_backup_${new Date().toISOString().split('T')[0]}.json`);
    return res.send(JSON.stringify(backup, null, 2));
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

  // Admin: reset all data (clear all expenses + non-admin users)
  app.post('/api/admin/reset-all-data', requireAdmin, async (req, res) => {
    try {
      await storage.resetAllData();
      res.json({ message: 'All data cleared successfully.' });
    } catch (err) {
      res.status(500).json({ message: 'Failed to reset data.' });
    }
  });

  // Ensure Admin account always exists with correct credentials and isAdmin=true
  async function seed() {
    try {
      const adminUsername = "Admin";
      const existing = await storage.getUserByUsername(adminUsername);
      if (!existing) {
        const hashed = await hashPassword("Anvi@1981");
        await storage.createUser({ username: adminUsername, password: hashed, isAdmin: true });
        console.log("Admin user created (Admin / Anvi@1981).");
      } else if (!existing.isAdmin) {
        await storage.setUserAdmin(existing.id, true);
        console.log("Admin user promoted to admin.");
      } else {
        console.log("Admin user ready.");
      }
    } catch (err) {
      console.error("Seed error:", err);
    }
  }

  seed();

  return httpServer;
}
