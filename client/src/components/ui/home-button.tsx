import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { Link } from "wouter";

interface HomeButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  showText?: boolean;
}

export function HomeButton({ 
  className = "", 
  variant = "outline", 
  size = "default",
  showIcon = true,
  showText = true
}: HomeButtonProps) {
  return (
    <Link href="/">
      <Button 
        variant={variant} 
        size={size} 
        className={`flex items-center gap-2 ${className}`}
      >
        {showIcon && <Home className="h-4 w-4" />}
        {showText && "Home"}
      </Button>
    </Link>
  );
}