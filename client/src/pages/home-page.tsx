import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import VitalCard from "@/components/dashboard/vital-card";
import HistoricalChart from "@/components/dashboard/historical-chart";
import AlertItem from "@/components/dashboard/alert-item";
import { ThingSpeakResponse, Alert } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [selectedChart, setSelectedChart] = useState<'heart-rate' | 'oxygen' | 'temperature'>('heart-rate');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch patients if user is a caregiver
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["/api/patients"],
    enabled: user?.role === "caregiver",
  });

  // Determine which patient ID to use for data fetching
  const targetPatientId = user?.role === "caregiver" && selectedPatientId 
    ? selectedPatientId 
    : user?.id;

  // Fetch latest vitals data
  const { 
    data: vitalsData, 
    isLoading: vitalsLoading, 
    error: vitalsError
  } = useQuery<ThingSpeakResponse>({
    queryKey: [
      user?.role === "caregiver" && selectedPatientId 
        ? `/api/patients/${selectedPatientId}/vitals/latest` 
        : "/api/vitals/latest"
    ],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!targetPatientId,
  });

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
    data: alerts, 
    isLoading: alertsLoading 
  } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Get the latest readings
  const latestReading = vitalsData?.feeds?.[0];
  
  // Format last updated time
  const lastUpdated = latestReading?.created_at 
    ? new Date(latestReading.created_at).toLocaleTimeString() 
    : "N/A";

  // Handle patient selection change
  const handlePatientChange = (patientId: number) => {
    setSelectedPatientId(patientId);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Header 
        user={user} 
        onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} 
        alertCount={alerts?.filter(a => !a.isRead).length || 0}
      />

      <div className="flex flex-1">
        <Sidebar 
          user={user} 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          patients={patients || []} 
          onPatientSelect={handlePatientChange}
          selectedPatientId={selectedPatientId}
          alertCount={alerts?.filter(a => !a.isRead).length || 0}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="px-4 sm:px-6 py-6">
            {/* Patient Info Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Patient Overview</h1>
                {user?.role === "caregiver" && patients && patients.length > 0 && (
                  <div className="relative">
                    <select 
                      className="appearance-none bg-neutral-dark border border-gray-700 rounded-lg py-2 pl-4 pr-10 text-white"
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
                )}
              </div>
              
              {vitalsLoading ? (
                <div className="mt-4 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : vitalsError ? (
                <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <p className="text-destructive">Error loading vital signs data. Please check device connection.</p>
                </div>
              ) : (
                <div className="flex flex-wrap items-center mt-4 text-sm text-muted-foreground">
                  <div className="ml-auto flex items-center mb-2">
                    <span className="text-white mr-2">Last updated:</span>
                    <span className="text-primary">{lastUpdated}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Vitals Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <VitalCard 
                type="heart-rate"
                value={latestReading?.field1}
                isLoading={vitalsLoading}
              />
              
              <VitalCard 
                type="oxygen"
                value={latestReading?.field2}
                isLoading={vitalsLoading}
              />
              
              <VitalCard 
                type="temperature"
                value={latestReading?.field3}
                isLoading={vitalsLoading}
              />
            </div>

            {/* Alerts Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Alerts</h2>
                <Button variant="link" className="text-primary" size="sm">
                  View All
                </Button>
              </div>

              <div className="bg-neutral-dark rounded-xl shadow-lg overflow-hidden">
                {alertsLoading ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  alerts.slice(0, 3).map((alert) => (
                    <AlertItem key={alert.id} alert={alert} />
                  ))
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No alerts to display
                  </div>
                )}
              </div>
            </div>

            {/* Historical Chart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">10-Day Trend Analysis</h2>
                <div className="flex space-x-2">
                  <Button 
                    size="sm"
                    variant={selectedChart === "heart-rate" ? "default" : "outline"}
                    onClick={() => setSelectedChart("heart-rate")}
                  >
                    Heart Rate
                  </Button>
                  <Button 
                    size="sm"
                    variant={selectedChart === "oxygen" ? "default" : "outline"}
                    onClick={() => setSelectedChart("oxygen")}
                  >
                    Oxygen
                  </Button>
                  <Button 
                    size="sm"
                    variant={selectedChart === "temperature" ? "default" : "outline"}
                    onClick={() => setSelectedChart("temperature")}
                  >
                    Temperature
                  </Button>
                </div>
              </div>

              <HistoricalChart 
                type={selectedChart}
                data={historicalData}
                isLoading={historicalLoading}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
