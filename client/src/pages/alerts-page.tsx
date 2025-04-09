import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Bell, Search, Filter, CheckCheck } from "lucide-react";
import { Alert, User } from "@shared/schema";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import AlertItem from "@/components/dashboard/alert-item";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function AlertsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    heartRate: true,
    oxygen: true,
    temperature: true,
    device: true,
    unread: false
  });
  
  // Fetch patients if user is a caregiver
  const { data: patients = [], isLoading: patientsLoading } = useQuery<User[]>({
    queryKey: ["/api/patients"],
    enabled: user?.role === "caregiver",
  });

  // Fetch alerts
  const { data: alerts = [], isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark all alerts as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/alerts/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  // Handle patient selection change
  const handlePatientChange = (patientId: number) => {
    setSelectedPatientId(patientId);
  };

  // Handle marking all alerts as read
  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Filter alerts based on search term and selected filters
  const filteredAlerts = alerts.filter(alert => {
    // Apply search filter
    const searchMatch = !searchTerm || 
      alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply type filters
    const typeMatch = 
      (filters.heartRate && alert.type === 'heart-rate') ||
      (filters.oxygen && alert.type === 'oxygen') ||
      (filters.temperature && alert.type === 'temperature') ||
      (filters.device && alert.type === 'device');
    
    // Apply read/unread filter
    const readStatusMatch = !filters.unread || !alert.isRead;
    
    return searchMatch && typeMatch && readStatusMatch;
  });

  // Get alert counts by type
  const alertCounts = {
    total: filteredAlerts.length,
    unread: filteredAlerts.filter(a => !a.isRead).length,
    heartRate: filteredAlerts.filter(a => a.type === 'heart-rate').length,
    oxygen: filteredAlerts.filter(a => a.type === 'oxygen').length,
    temperature: filteredAlerts.filter(a => a.type === 'temperature').length,
    device: filteredAlerts.filter(a => a.type === 'device').length,
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Header 
        user={user} 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        alertCount={alerts.filter(a => !a.isRead).length}
      />

      <div className="flex flex-1">
        <Sidebar 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          patients={patients} 
          onPatientSelect={handlePatientChange}
          selectedPatientId={selectedPatientId}
          alertCount={alerts.filter(a => !a.isRead).length}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="px-4 sm:px-6 py-6">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Alerts</h1>
                <p className="text-muted-foreground mt-1">
                  View and manage vital signs alerts
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={handleMarkAllAsRead}
                  disabled={alerts.filter(a => !a.isRead).length === 0}
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark All as Read
                </Button>
              </div>
            </div>
            
            {/* Filters and Search */}
            <Card className="bg-neutral-dark mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts..."
                      className="pl-9 bg-background border-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filter
                        {(Object.values(filters).filter(Boolean).length !== Object.keys(filters).length) && (
                          <Badge className="ml-1 bg-primary text-xs">
                            {Object.values(filters).filter(Boolean).length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Filter Alerts</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={filters.unread}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, unread: checked }))}
                      >
                        Unread Only
                        {alertCounts.unread > 0 && (
                          <Badge className="ml-auto">{alertCounts.unread}</Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Alert Types</DropdownMenuLabel>
                      <DropdownMenuCheckboxItem
                        checked={filters.heartRate}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, heartRate: checked }))}
                      >
                        Heart Rate
                        {alertCounts.heartRate > 0 && (
                          <Badge className="ml-auto">{alertCounts.heartRate}</Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filters.oxygen}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, oxygen: checked }))}
                      >
                        Oxygen
                        {alertCounts.oxygen > 0 && (
                          <Badge className="ml-auto">{alertCounts.oxygen}</Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filters.temperature}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, temperature: checked }))}
                      >
                        Temperature
                        {alertCounts.temperature > 0 && (
                          <Badge className="ml-auto">{alertCounts.temperature}</Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={filters.device}
                        onCheckedChange={(checked) => setFilters(prev => ({ ...prev, device: checked }))}
                      >
                        Device
                        {alertCounts.device > 0 && (
                          <Badge className="ml-auto">{alertCounts.device}</Badge>
                        )}
                      </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
            
            {/* Alerts List */}
            <Card className="bg-neutral-dark shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle>Recent Alerts</CardTitle>
                  <Badge className="text-xs bg-primary px-2 py-1">
                    {alertCounts.total} {alertCounts.total === 1 ? 'Alert' : 'Alerts'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 text-muted-foreground opacity-30" />
                    <p className="text-center mb-2">No alerts to display</p>
                    <p className="text-center text-sm">
                      {searchTerm || !filters.heartRate || !filters.oxygen || !filters.temperature || !filters.device || filters.unread ? 
                        "Try changing your search or filter settings" : 
                        "Alerts will appear here when vital signs go outside normal ranges"}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border border-gray-700 overflow-hidden mb-4">
                    {filteredAlerts.map((alert) => (
                      <AlertItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                )}
                
                {filteredAlerts.length > 0 && (
                  <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
                    <span>
                      Showing {filteredAlerts.length} {filteredAlerts.length === 1 ? 'alert' : 'alerts'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Click on unread alerts to mark them as read</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}