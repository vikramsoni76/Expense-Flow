import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-2">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold font-display">Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button className="w-full mt-4 rounded-xl">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
