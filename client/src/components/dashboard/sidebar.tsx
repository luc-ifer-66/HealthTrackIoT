import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Home, UserRound, Heart, Bell, Settings, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  patients: User[];
  onPatientSelect: (patientId: number) => void;
  selectedPatientId: number | null;
  alertCount: number;
}

export default function Sidebar({ 
  user, 
  isOpen, 
  onClose, 
  patients, 
  onPatientSelect, 
  selectedPatientId,
  alertCount 
}: SidebarProps) {
  const { logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

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

  const navigateTo = (path: string) => {
    setLocation(path);
    onClose();
  };

  const sidebarContent = (
    <div className="px-4 py-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <Badge variant="secondary" className="bg-primary text-white">
          {user?.role === 'caregiver' ? 'Caregiver' : 'Patient'}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <Button 
          variant="ghost" 
          className="flex items-center w-full justify-start gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary"
          onClick={() => navigateTo("/")}
        >
          <Home className="h-5 w-5" />
          <span>Overview</span>
        </Button>
        
        {user?.role === 'caregiver' && (
          <Button 
            variant="ghost" 
            className="flex items-center w-full justify-start gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-muted-foreground"
            onClick={() => navigateTo("/patients")}
          >
            <UserRound className="h-5 w-5" />
            <span>Patients</span>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          className="flex items-center w-full justify-start gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-muted-foreground"
          onClick={() => navigateTo("/vitals")}
        >
          <Heart className="h-5 w-5" />
          <span>Vitals History</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex items-center w-full justify-start gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-muted-foreground"
          onClick={() => navigateTo("/alerts")}
        >
          <Bell className="h-5 w-5" />
          <span>Alerts</span>
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {alertCount}
            </Badge>
          )}
        </Button>
        
        <Button 
          variant="ghost" 
          className="flex items-center w-full justify-start gap-3 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-muted-foreground"
          onClick={() => navigateTo("/settings")}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Button>
      </div>
      
      {user?.role === 'caregiver' && patients.length > 0 && (
        <div className="mt-6">
          <Separator className="mb-4" />
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Patients</h3>
          <div className="space-y-2">
            {patients.map(patient => (
              <div 
                key={patient.id}
                className={`flex items-center p-2 rounded-lg hover:bg-primary/5 cursor-pointer ${
                  selectedPatientId === patient.id ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => onPatientSelect(patient.id)}
              >
                <div className={`h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-white font-medium mr-3`}>
                  {getInitials(patient.name)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{patient.name}</p>
                  <p className="text-xs text-muted-foreground">ID: P-{patient.id}</p>
                </div>
                <div className="ml-auto">
                  <span className="h-2 w-2 rounded-full bg-success block"></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-auto pt-4">
        <Button 
          variant="ghost" 
          className="flex items-center w-full justify-center gap-2 px-4 py-2.5 hover:bg-primary/5 hover:text-primary text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );

  // For mobile, use Sheet component
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0 bg-neutral-dark border-r border-gray-800">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  // For desktop, use fixed sidebar
  return (
    <Card className="w-64 bg-neutral-dark border-r border-gray-800 h-[calc(100vh-56px)] overflow-y-auto hidden lg:block">
      {sidebarContent}
    </Card>
  );
}
