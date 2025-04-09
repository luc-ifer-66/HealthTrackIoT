import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Save, PlusCircle, User, Bell, Shield, Smartphone, AlertCircle } from "lucide-react";
import Header from "@/components/dashboard/header";
import Sidebar from "@/components/dashboard/sidebar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert } from "@shared/schema";
import ThresholdForm from "@/components/dashboard/threshold-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Form schemas
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
});

const securityFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

const notificationsFormSchema = z.object({
  emailAlerts: z.boolean().default(true),
  smsAlerts: z.boolean().default(false),
  criticalAlertsOnly: z.boolean().default(false),
});

const deviceFormSchema = z.object({
  deviceName: z.string().min(2, "Device name must be at least 2 characters"),
  channelId: z.string().min(3, "Please enter a valid channel ID"),
  apiKey: z.string().min(8, "Please enter a valid API key"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type SecurityFormValues = z.infer<typeof securityFormSchema>;
type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;
type DeviceFormValues = z.infer<typeof deviceFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddingDevice, setIsAddingDevice] = useState(false);
  
  // Fetch alerts
  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: "",
      address: "",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  // Security form setup
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Notifications form setup
  const notificationsForm = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues: {
      emailAlerts: true,
      smsAlerts: false,
      criticalAlertsOnly: false,
    },
  });

  // Device form setup
  const deviceForm = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      deviceName: "",
      channelId: "",
      apiKey: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      await apiRequest("PATCH", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Security update mutation
  const updateSecurityMutation = useMutation({
    mutationFn: async (data: SecurityFormValues) => {
      await apiRequest("PATCH", "/api/user/password", { 
        oldPassword: data.currentPassword,
        newPassword: data.newPassword 
      });
    },
    onSuccess: () => {
      securityForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Notifications update mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationsFormValues) => {
      await apiRequest("PATCH", "/api/user/notifications", data);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (data: DeviceFormValues) => {
      await apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      setIsAddingDevice(false);
      deviceForm.reset();
      toast({
        title: "Device added",
        description: "Your new device has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const onSecuritySubmit = (data: SecurityFormValues) => {
    updateSecurityMutation.mutate(data);
  };

  const onNotificationsSubmit = (data: NotificationsFormValues) => {
    updateNotificationsMutation.mutate(data);
  };

  const onDeviceSubmit = (data: DeviceFormValues) => {
    addDeviceMutation.mutate(data);
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
          patients={[]} 
          onPatientSelect={() => {}}
          selectedPatientId={null}
          alertCount={alerts?.filter(a => !a.isRead).length || 0}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="px-4 sm:px-6 py-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account and preferences
              </p>
            </div>
            
            {/* Settings Tabs */}
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="devices">Devices</TabsTrigger>
                <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John Doe"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="john@example.com"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+1 (555) 123-4567"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="123 Main St, City, Country"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Emergency Contact Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="emergencyContact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emergency Contact Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Jane Doe"
                                      className="bg-background border-gray-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={profileForm.control}
                              name="emergencyPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Emergency Contact Phone</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="+1 (555) 987-6543"
                                      className="bg-background border-gray-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="mt-4"
                          disabled={updateProfileMutation.isPending}
                        >
                          {updateProfileMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Changes
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Update your password and security preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...securityForm}>
                      <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={securityForm.control}
                            name="currentPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={securityForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Password must be at least 6 characters long
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={securityForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-background border-gray-700 text-white"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="mt-4"
                          disabled={updateSecurityMutation.isPending}
                        >
                          {updateSecurityMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Update Password
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>
                      Configure how and when you receive alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationsForm}>
                      <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                        <div className="space-y-4">
                          <FormField
                            control={notificationsForm.control}
                            name="emailAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Email Alerts</FormLabel>
                                  <FormDescription>
                                    Receive alerts via email when vital signs are outside normal ranges
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="smsAlerts"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">SMS Alerts</FormLabel>
                                  <FormDescription>
                                    Receive text message alerts when vital signs are outside normal ranges
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={notificationsForm.control}
                            name="criticalAlertsOnly"
                            render={({ field }) => (
                              <FormItem className="flex items-center justify-between rounded-lg border border-gray-700 p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">Critical Alerts Only</FormLabel>
                                  <FormDescription>
                                    Only receive alerts for critical (high severity) vital sign anomalies
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="mt-4"
                          disabled={updateNotificationsMutation.isPending}
                        >
                          {updateNotificationsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Save Notification Settings
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Devices Tab */}
              <TabsContent value="devices">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle>Connected Devices</CardTitle>
                      <CardDescription>
                        Manage your IoT monitoring devices
                      </CardDescription>
                    </div>
                    <Dialog open={isAddingDevice} onOpenChange={setIsAddingDevice}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <PlusCircle className="h-4 w-4" />
                          Add Device
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-neutral-dark">
                        <DialogHeader>
                          <DialogTitle>Add New Device</DialogTitle>
                          <DialogDescription>
                            Connect a new health monitoring device to your account
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...deviceForm}>
                          <form onSubmit={deviceForm.handleSubmit(onDeviceSubmit)} className="space-y-4">
                            <FormField
                              control={deviceForm.control}
                              name="deviceName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Device Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="My Health Monitor"
                                      className="bg-background border-gray-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="channelId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>ThingSpeak Channel ID</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="123456"
                                      className="bg-background border-gray-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Find this in your ThingSpeak channel settings
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="apiKey"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>API Key</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="ABCDEF123456"
                                      className="bg-background border-gray-700 text-white"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Your ThingSpeak read API key
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter className="mt-6">
                              <Button type="button" variant="outline" onClick={() => setIsAddingDevice(false)}>
                                Cancel
                              </Button>
                              <Button 
                                type="submit"
                                disabled={addDeviceMutation.isPending}
                              >
                                {addDeviceMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                )}
                                Add Device
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-gray-700 overflow-hidden mb-4">
                      <div className="p-6 text-center">
                        <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                        <h3 className="text-lg font-medium mb-2">No devices connected</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          You haven't connected any health monitoring devices yet
                        </p>
                        <Button 
                          variant="outline" 
                          className="gap-2"
                          onClick={() => setIsAddingDevice(true)}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Add Your First Device
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="mb-2">
                        <strong>Note:</strong> To connect your ESP32 device:
                      </p>
                      <ol className="list-decimal pl-5 space-y-1">
                        <li>Set up a ThingSpeak channel with the following fields:</li>
                        <ul className="list-disc pl-5 mb-2">
                          <li>Field 1: Heart Rate (bpm)</li>
                          <li>Field 2: Oxygen Saturation (%)</li>
                          <li>Field 3: Temperature (°C)</li>
                        </ul>
                        <li>Program your ESP32 to send data to your ThingSpeak channel</li>
                        <li>Add the device here using the channel ID and read API key</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Thresholds Tab */}
              <TabsContent value="thresholds">
                <Card className="bg-neutral-dark shadow-lg">
                  <CardHeader>
                    <CardTitle>Alert Thresholds</CardTitle>
                    <CardDescription>
                      Customize your vital sign alert thresholds
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Set custom thresholds for when you receive alerts about your vital signs. If a vital sign goes outside the range you define, 
                        you'll receive an alert. Leave the default values if you're unsure.
                      </p>
                      
                      <ThresholdForm />
                    </div>
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