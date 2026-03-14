import { useExpenses } from "@/hooks/use-expenses";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Filter, Plane, Coffee, MoreHorizontal, AlertCircle, CheckCircle2, Clock, Edit2, Trash2, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { expenses, isLoading, createExpense, updateExpense, deleteExpense } = useExpenses();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Filter expenses based on search and status
  const filteredExpenses = expenses?.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(search.toLowerCase()) ||
      expense.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Calculate totals
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const pendingAmount = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, expense) => sum + Number(expense.amount), 0);
  const approvedAmount = filteredExpenses.filter(e => e.status === 'approved').reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Chart data preparation - expenses by category
  const categoryData = [
    { name: 'Travel', value: filteredExpenses.filter(e => e.category === 'Travel').reduce((sum, e) => sum + Number(e.amount), 0), color: '#3b82f6' },
    { name: 'Food', value: filteredExpenses.filter(e => e.category === 'Food').reduce((sum, e) => sum + Number(e.amount), 0), color: '#f97316' },
    { name: 'Hotel', value: filteredExpenses.filter(e => e.category === 'Hotel').reduce((sum, e) => sum + Number(e.amount), 0), color: '#a855f7' },
    { name: 'Other', value: filteredExpenses.filter(e => e.category === 'Other').reduce((sum, e) => sum + Number(e.amount), 0), color: '#6b7280' },
  ].filter(item => item.value > 0);

  const handleCreate = async (data: any) => {
    await createExpense.mutateAsync(data);
    setOpen(false);
  };

  const handleUpdate = async (data: any) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, ...data });
      setEditingExpense(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense.mutateAsync(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved':
        return <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200">Pending</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Travel': return <Plane className="w-4 h-4 text-blue-500" />;
      case 'Food': return <Coffee className="w-4 h-4 text-orange-500" />;
      case 'Hotel': return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      default: return <MoreHorizontal className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your expense reports</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/25 rounded-xl px-6 h-11 font-semibold transition-all hover:-translate-y-0.5" data-testid="button-add-expense">
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">New Expense</DialogTitle>
              <DialogDescription>
                Fill in the details below to submit a new expense claim.
              </DialogDescription>
            </DialogHeader>
            <ExpenseForm onSubmit={handleCreate} isSubmitting={createExpense.isPending} />
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display">Edit Expense</DialogTitle>
              <DialogDescription>
                Modify the details of your expense record.
              </DialogDescription>
            </DialogHeader>
            {editingExpense && (
              <ExpenseForm 
                onSubmit={handleUpdate} 
                isSubmitting={updateExpense.isPending} 
                defaultValues={{
                  ...editingExpense,
                  date: new Date(editingExpense.date),
                  amount: Number(editingExpense.amount)
                }} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="font-bold">₹</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display" data-testid="text-total-amount">₹{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">For selected period</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-yellow-600" data-testid="text-pending-amount">₹{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-green-600" data-testid="text-approved-amount">₹{approvedAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Reimbursable amount</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search expenses..." 
                className="pl-9 h-10 rounded-xl bg-background border-border/60" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-10 rounded-xl border-border/60" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-64 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-secondary mb-4 flex items-center justify-center">
                            <Search className="w-8 h-8 opacity-50" />
                          </div>
                          <p className="text-lg font-medium">No expenses found</p>
                          <p className="text-sm">Try adjusting your filters or add a new expense.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="group hover:bg-secondary/20 transition-colors">
                        <TableCell className="font-medium text-muted-foreground">
                          {(() => {
                            try {
                              const d = new Date(expense.date);
                              return isNaN(d.getTime()) ? expense.date : format(d, "MMM d, yyyy");
                            } catch {
                              return expense.date;
                            }
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{expense.description}</div>
                          {expense.customerName && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                              {expense.customerName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              expense.category === 'Travel' ? "bg-blue-500/10" :
                              expense.category === 'Food' ? "bg-orange-500/10" : 
                              expense.category === 'Hotel' ? "bg-purple-500/10" : "bg-gray-500/10"
                            )}>
                              {getCategoryIcon(expense.category)}
                            </div>
                            {expense.category}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold font-mono text-base">
                          ₹{Number(expense.amount).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(expense.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => setEditingExpense(expense)}
                              disabled={expense.status !== 'pending'}
                              data-testid={`button-edit-${expense.id}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(expense.id)}
                              disabled={expense.status !== 'pending'}
                              data-testid={`button-delete-${expense.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Sidebar Charts */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm h-fit">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Distribution of expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={50} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No data to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground border-none shadow-lg">
            <CardContent className="pt-6">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> 
                Policy Reminder
              </h3>
              <p className="text-sm opacity-90 leading-relaxed">
                Travel expenses over ₹40,000 require pre-approval. Ensure all receipts are clear and legible before submission.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
