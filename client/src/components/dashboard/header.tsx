import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  user: User | null;
  onSidebarToggle: () => void;
  alertCount: number;
}

export default function Header({ user, onSidebarToggle, alertCount }: HeaderProps) {
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-neutral-dark border-b border-gray-800 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-white"
            onClick={onSidebarToggle}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center">
            <span className="text-primary text-2xl font-bold">Health</span>
            <span className="text-white text-2xl font-bold">Monitor</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1 bg-background rounded-lg px-3 py-1">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {alertCount > 0 && (
              <Badge variant="destructive" className="text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {alertCount}
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 h-auto">
                <div className="flex items-center space-x-3">
                  <span className="hidden md:inline text-sm font-medium">{user?.name}</span>
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                    {user ? getInitials(user.name) : 'U'}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
