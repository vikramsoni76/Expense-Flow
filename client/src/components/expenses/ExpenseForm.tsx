import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertExpenseSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plane, Bus, Car, Train, ShoppingBag, Coffee, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

// Extend the schema for form handling (coerce numbers)
const formSchema = insertExpenseSchema.extend({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date: z.coerce.date(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function ExpenseForm({ defaultValues, onSubmit, isSubmitting }: ExpenseFormProps) {
  const [dateOpen, setDateOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "Travel",
      travelMode: "Car",
      date: new Date(),
      status: "pending", // Will be stripped by schema if not needed, or handled by API default
      ...defaultValues,
    } as any,
  });

  const category = form.watch("category");
  const isTravel = category === "Travel";

  // Reset travel fields if category changes from Travel to something else
  useEffect(() => {
    if (!isTravel) {
      form.setValue("travelMode", null);
      form.setValue("startLocation", null);
      form.setValue("endLocation", null);
    }
  }, [isTravel, form]);

  const handleSubmit = async (data: FormValues) => {
    // Format date string as YYYY-MM-DD for the API
    const formattedData = {
      ...data,
      date: format(data.date, 'yyyy-MM-dd'),
    };
    await onSubmit(formattedData as any);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>
                <FormControl>
                  <Input placeholder="Client or Business Name" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal h-10 rounded-xl bg-background",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background border border-border shadow-md" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setDateOpen(false);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 rounded-xl bg-background">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background">
                    <SelectItem value="Travel">
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-blue-500" /> Travel
                      </div>
                    </SelectItem>
                    <SelectItem value="Food">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-4 h-4 text-orange-500" /> Food
                      </div>
                    </SelectItem>
                    <SelectItem value="Hotel">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-purple-500" /> Hotel
                      </div>
                    </SelectItem>
                    <SelectItem value="Other">
                      <div className="flex items-center gap-2">
                        <MoreHorizontal className="w-4 h-4 text-gray-500" /> Other
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                    <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isTravel && (
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Travel Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="travelMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode of Travel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background">
                        <SelectItem value="Air">Air</SelectItem>
                        <SelectItem value="Train">Train</SelectItem>
                        <SelectItem value="Taxi">Taxi</SelectItem>
                        <SelectItem value="Car">Car (Personal)</SelectItem>
                        <SelectItem value="Bus">Bus</SelectItem>
                        <SelectItem value="Metro">Metro</SelectItem>
                        <SelectItem value="Auto">Auto Rickshaw</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input placeholder="Starting Point" className="bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input placeholder="Destination" className="bg-background" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Details about the expense (optional)..." 
                  className="resize-none min-h-[80px]" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 rounded-xl font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Expense"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
