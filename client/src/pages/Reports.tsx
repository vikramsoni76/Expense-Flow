import { useExpenses } from "@/hooks/use-expenses";
import { useState } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon, Download, FileText } from "lucide-react";
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
      downloadReport(); // Download all if no range
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold font-display tracking-tight">Reports</h2>
        <p className="text-muted-foreground mt-1">Generate and download expense reports</p>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader>
          <CardTitle>Export Expenses</CardTitle>
          <CardDescription>
            Select a date range to generate a CSV report of your expenses.
            This report includes all details suitable for accounting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Date Range
            </label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[300px] justify-start text-left font-normal h-11 rounded-xl border-border/60",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
                  Report format: <span className="font-medium text-foreground">CSV (Comma Separated Values)</span>
                  <br/>
                  Compatible with: Google Sheets, Excel, Numbers
                </p>
             </div>
             
             <Button 
               onClick={handleDownload}
               disabled={!date?.from || !date?.to}
               className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20 font-semibold"
             >
                <Download className="mr-2 h-4 w-4" /> Download Report
             </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/50">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-300">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
               Automated monthly reports are sent to your email on the 1st of every month. 
               Check your inbox for the latest summary.
             </p>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/50">
          <CardHeader>
            <CardTitle className="text-orange-700 dark:text-orange-300">Google Sheets Sync</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-orange-600/80 dark:text-orange-400/80">
               Your expenses are automatically synced to the central finance sheet every 15 minutes.
               No manual action required.
             </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
