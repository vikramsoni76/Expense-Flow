import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertExpense } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useExpenses() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const expensesQuery = useQuery({
    queryKey: [api.expenses.list.path],
    queryFn: async () => {
      const res = await fetch(api.expenses.list.path);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return api.expenses.list.responses[200].parse(await res.json());
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const res = await fetch(api.expenses.create.path, {
        method: api.expenses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.expenses.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create expense");
      }
      return api.expenses.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({
        title: "Expense added",
        description: "Your expense has been successfully recorded.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertExpense> & { status?: string }) => {
      const url = buildUrl(api.expenses.update.path, { id });
      const res = await fetch(url, {
        method: api.expenses.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update expense");
      return api.expenses.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({
        title: "Expense updated",
        description: "Changes have been saved.",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.expenses.delete.path, { id });
      const res = await fetch(url, { method: api.expenses.delete.method });
      if (!res.ok) throw new Error("Failed to delete expense");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.expenses.list.path] });
      toast({
        title: "Expense deleted",
        description: "The expense has been removed.",
      });
    },
  });

  const downloadReport = async (startDate?: string, endDate?: string) => {
    // Construct query parameters
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const url = `${api.reports.csv.path}?${params.toString()}`;
    
    // Trigger download
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `expenses_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    expenses: expensesQuery.data,
    isLoading: expensesQuery.isLoading,
    isError: expensesQuery.isError,
    createExpense: createExpenseMutation,
    updateExpense: updateExpenseMutation,
    deleteExpense: deleteExpenseMutation,
    downloadReport,
  };
}
