import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2, XCircle, Clock, Search, Filter, Download,
  Plane, Coffee, ShoppingBag, MoreHorizontal, Users, TrendingUp, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ExpenseWithUser = {
  id: number;
  userId: number;
  username: string;
  date: string;
  description: string | null;
  startLocation: string | null;
  endLocation: string | null;
  customerName: string | null;
  travelMode: string | null;
  amount: string;
  category: string;
  status: string;
  createdAt: string | null;
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [userFilter, setUserFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: expenses = [], isLoading } = useQuery<ExpenseWithUser[]>({
    queryKey: ['/api/admin/expenses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/expenses');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/admin/expenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/expenses'] });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update expense status.' });
    },
  });

  const handleApprove = async (id: number) => {
    await updateStatus.mutateAsync({ id, status: 'approved' });
    toast({ title: 'Approved', description: 'Expense has been approved.' });
  };

  const handleReject = async (id: number) => {
    await updateStatus.mutateAsync({ id, status: 'rejected' });
    toast({ title: 'Rejected', description: 'Expense has been rejected.' });
  };

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => updateStatus.mutateAsync({ id, status: 'approved' })));
    setSelectedIds(new Set());
    toast({ title: `${ids.length} expenses approved`, description: 'All selected expenses have been approved.' });
  };

  const handleBulkReject = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => updateStatus.mutateAsync({ id, status: 'rejected' })));
    setSelectedIds(new Set());
    toast({ title: `${ids.length} expenses rejected`, description: 'All selected expenses have been rejected.' });
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredPendingIds = filteredExpenses.filter(e => e.status === 'pending').map(e => e.id);
    if (filteredPendingIds.every(id => selectedIds.has(id)) && filteredPendingIds.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPendingIds));
    }
  };

  const uniqueUsers = Array.from(new Set(expenses.map(e => e.username)));

  const filteredExpenses = expenses.filter(e => {
    const matchSearch =
      (e.customerName?.toLowerCase().includes(search.toLowerCase()) || false) ||
      (e.description?.toLowerCase().includes(search.toLowerCase()) || false) ||
      e.username.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchUser = userFilter === 'all' || e.username === userFilter;
    return matchSearch && matchStatus && matchUser;
  });

  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + Number(e.amount), 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + Number(e.amount), 0);

  const pendingFilteredIds = filteredExpenses.filter(e => e.status === 'pending').map(e => e.id);
  const allPendingSelected = pendingFilteredIds.length > 0 && pendingFilteredIds.every(id => selectedIds.has(id));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Travel': return <Plane className="w-4 h-4 text-blue-500" />;
      case 'Food': return <Coffee className="w-4 h-4 text-orange-500" />;
      case 'Hotel': return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      default: return <MoreHorizontal className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/15 text-green-700 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/15 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-200">Pending</Badge>;
    }
  };

  const safeDateFormat = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : format(d, 'dd/MM/yy');
    } catch { return dateStr; }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/api/admin/reports/csv';
    link.setAttribute('download', `all_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-1">Review and approve employee expense submissions</p>
        </div>
        <Button variant="outline" onClick={handleDownload} className="gap-2 rounded-xl" data-testid="button-admin-download">
          <Download className="w-4 h-4" /> Export All CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-yellow-700 uppercase tracking-wider">Pending</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-yellow-700" data-testid="stat-pending-count">{pendingCount}</div>
            <p className="text-xs text-yellow-600/70">₹{totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-green-700 uppercase tracking-wider">Approved</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-green-700" data-testid="stat-approved-count">{approvedCount}</div>
            <p className="text-xs text-green-600/70">₹{totalApproved.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employees</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold" data-testid="stat-employee-count">{uniqueUsers.length}</div>
            <p className="text-xs text-muted-foreground">with expenses</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold" data-testid="stat-total-count">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">all expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700 rounded-lg gap-1.5" data-testid="button-bulk-approve">
              <CheckCircle2 className="w-4 h-4" /> Approve All
            </Button>
            <Button size="sm" variant="destructive" onClick={handleBulkReject} className="rounded-lg gap-1.5" data-testid="button-bulk-reject">
              <XCircle className="w-4 h-4" /> Reject All
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee, customer, description..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-admin-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={val => { setStatusFilter(val); setSelectedIds(new Set()); }}>
          <SelectTrigger className="w-full sm:w-[150px] rounded-xl" data-testid="select-admin-status">
            <Filter className="w-4 h-4 mr-1" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl" data-testid="select-admin-user">
            <Users className="w-4 h-4 mr-1" /><SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent className="bg-background">
            <SelectItem value="all">All Employees</SelectItem>
            {uniqueUsers.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  {pendingFilteredIds.length > 0 && (
                    <Checkbox
                      checked={allPendingSelected}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  )}
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <AlertCircle className="w-10 h-10 mb-3 opacity-20" />
                      <p className="font-medium">No expenses found</p>
                      <p className="text-sm">Try adjusting your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map(expense => (
                  <TableRow key={expense.id} className={cn("group transition-colors", selectedIds.has(expense.id) && "bg-primary/5")}>
                    <TableCell>
                      {expense.status === 'pending' && (
                        <Checkbox
                          checked={selectedIds.has(expense.id)}
                          onCheckedChange={() => toggleSelect(expense.id)}
                          data-testid={`checkbox-expense-${expense.id}`}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {expense.username[0]?.toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{expense.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{safeDateFormat(expense.date)}</TableCell>
                    <TableCell className="text-sm">
                      <div>{expense.customerName || <span className="text-muted-foreground italic">—</span>}</div>
                      {expense.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{expense.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        {getCategoryIcon(expense.category)}
                        <span>{expense.category}</span>
                        {expense.travelMode && (
                          <span className="text-xs text-muted-foreground">• {expense.travelMode}</span>
                        )}
                      </div>
                      {(expense.startLocation || expense.endLocation) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {expense.startLocation} → {expense.endLocation}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-bold font-mono">₹{Number(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell className="text-right">
                      {expense.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(expense.id)}
                            disabled={updateStatus.isPending}
                            className="h-8 px-3 bg-green-600 hover:bg-green-700 rounded-lg text-xs gap-1"
                            data-testid={`button-approve-${expense.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(expense.id)}
                            disabled={updateStatus.isPending}
                            className="h-8 px-3 rounded-lg text-xs gap-1"
                            data-testid={`button-reject-${expense.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
