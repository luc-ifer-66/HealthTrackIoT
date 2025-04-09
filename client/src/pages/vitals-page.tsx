import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, Download } from "lucide-react";
import { ThingSpeakResponse, Alert, User } from "@shared/schema";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HistoricalChart from "@/components/dashboard/historical-chart";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function VitalsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Fetch patients if user is a caregiver
  const { data: patients = [], isLoading: patientsLoading } = useQuery<User[]>({
    queryKey: ["/api/patients"],
    enabled: user?.role === "caregiver",
  });

  // Determine which patient ID to use for data fetching
  const targetPatientId = user?.role === "caregiver" && selectedPatientId 
    ? selectedPatientId 
    : user?.id;

  // Fetch historical data
  const { 
    data: historicalData, 
    isLoading: historicalLoading 
  } = useQuery<ThingSpeakResponse>({
    queryKey: [
      user?.role === "caregiver" && selectedPatientId 
        ? `/api/patients/${selectedPatientId}/vitals/history` 
        : "/api/vitals/history"
    ],
    enabled: !!targetPatientId,
  });

  // Fetch alerts
  const { 
    data: alerts = [], 
    isLoading: alertsLoading 
  } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Handle patient selection change
  const handlePatientChange = (patientId: number) => {
    setSelectedPatientId(patientId);
  };

  // Handle export all data
  const handleExportAllData = () => {
    if (!historicalData?.feeds || historicalData.feeds.length === 0) return;
    
    try {
      const headers = ["Date,Heart Rate (bpm),Oxygen Saturation (%),Temperature (°C)"];
      
      const rows = historicalData.feeds.map(item => {
        return `${new Date(item.created_at).toISOString()},${item.field1 || ''},${item.field2 || ''},${item.field3 || ''}`;
      });
      
      const csvContent = [...headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vital-signs-history-${format(selectedDate || new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export data", error);
    }
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
                <h1 className="text-2xl font-bold">Vital Signs History</h1>
                <p className="text-muted-foreground mt-1">
                  View and analyze historical vital signs data
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  variant="default" 
                  className="gap-2"
                  onClick={handleExportAllData}
                  disabled={!historicalData?.feeds || historicalData.feeds.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export All Data
                </Button>
              </div>
            </div>
            
            {/* Patient Selector (for caregivers) */}
            {user?.role === "caregiver" && patients && patients.length > 0 && (
              <Card className="mb-6 bg-neutral-dark">
                <CardContent className="p-4">
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-background border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white"
                      onChange={(e) => handlePatientChange(Number(e.target.value))}
                      value={selectedPatientId || ""}
                    >
                      <option value="">Select Patient</option>
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patient.name} (ID: {patient.id})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Tabs for different views */}
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="charts">Historical Charts</TabsTrigger>
                <TabsTrigger value="data">Data Table</TabsTrigger>
              </TabsList>
              
              {/* Charts View */}
              <TabsContent value="charts" className="space-y-6">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Heart Rate History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoricalChart 
                      type="heart-rate"
                      data={historicalData}
                      isLoading={historicalLoading}
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Oxygen Saturation History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoricalChart 
                      type="oxygen"
                      data={historicalData}
                      isLoading={historicalLoading}
                    />
                  </CardContent>
                </Card>
                
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Temperature History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HistoricalChart 
                      type="temperature"
                      data={historicalData}
                      isLoading={historicalLoading}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Data Table View */}
              <TabsContent value="data">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Vital Signs Data</CardTitle>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleExportAllData}
                        disabled={!historicalData?.feeds || historicalData.feeds.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {historicalLoading ? (
                      <div className="h-96 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !historicalData?.feeds || historicalData.feeds.length === 0 ? (
                      <div className="h-96 flex items-center justify-center text-muted-foreground">
                        No historical data available
                      </div>
                    ) : (
                      <div className="rounded-md border border-gray-700">
                        <div className="w-full overflow-auto">
                          <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                              <tr className="border-b border-gray-700 transition-colors hover:bg-neutral-dark/50">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                  Date & Time
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                  Heart Rate (bpm)
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                  SpO2 (%)
                                </th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                  Temperature (°C)
                                </th>
                              </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                              {historicalData.feeds.map((reading, index) => (
                                <tr 
                                  key={index} 
                                  className="border-b border-gray-700 transition-colors hover:bg-neutral-dark/50"
                                >
                                  <td className="p-4 align-middle">
                                    {new Date(reading.created_at).toLocaleString()}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {reading.field1 !== undefined ? reading.field1 : '-'}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {reading.field2 !== undefined ? reading.field2 : '-'}
                                  </td>
                                  <td className="p-4 align-middle">
                                    {reading.field3 !== undefined ? reading.field3 : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}