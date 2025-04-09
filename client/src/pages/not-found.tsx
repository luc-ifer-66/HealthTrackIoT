import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            The page you're looking for doesn't seem to exist.
          </p>
          
          <div className="mt-6">
            <Link href="/">
              <Button className="w-full flex items-center gap-2">
                <Home className="h-4 w-4" />
                Return to Home Page
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
