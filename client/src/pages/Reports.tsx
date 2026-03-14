import { useExpenses } from "@/hooks/use-expenses";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText, ShieldCheck, Info } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  const { downloadReport } = useExpenses();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const handleDownload = () => {
    if (date?.from && date?.to) {
      downloadReport(
        format(date.from, 'yyyy-MM-dd'),
        format(date.to, 'yyyy-MM-dd')
      );
    } else {
      downloadReport();
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">Generate and download your expense reports</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Export My Expenses</CardTitle>
          <CardDescription>
            Select a date range to generate a CSV report of your expenses, suitable for accounting and reimbursement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium leading-none">Date Range</label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal h-11 rounded-xl border-border/60 bg-background",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>{format(date.from, "dd/MM/yy")} – {format(date.to, "dd/MM/yy")}</>
                      ) : (
                        format(date.from, "dd/MM/yy")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background border border-border shadow-md" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border/40">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <FileText className="w-8 h-8 opacity-20" />
              <p>
                Format: <span className="font-medium text-foreground">CSV</span>
                <br />
                Opens in: Excel, LibreOffice, Numbers
              </p>
            </div>
            <Button
              onClick={handleDownload}
              disabled={!date?.from || !date?.to}
              className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 font-semibold"
              data-testid="button-download-report"
            >
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-4 h-4" /> CSV Column Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mb-2">
              Your downloaded report contains these columns:
            </p>
            <ol className="text-xs text-blue-600/80 dark:text-blue-400/80 list-decimal list-inside space-y-0.5 font-medium">
              <li>Date (DD/MM/YY)</li>
              <li>Customer Name</li>
              <li>Description</li>
              <li>Start Location</li>
              <li>End Location</li>
              <li>Category</li>
              <li>Mode</li>
              <li>Amount (INR)</li>
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-green-50/50 border-green-100 dark:bg-green-950/20 dark:border-green-900/50">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Data Safety Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700/80 dark:text-green-400/80 mb-3">
              Download your CSV report regularly and save it to your local drive or email it to yourself as a backup.
            </p>
            <p className="text-xs text-green-600/70 dark:text-green-400/60">
              Your admin can also export a full backup of all employees' data from the Admin Dashboard at any time.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
