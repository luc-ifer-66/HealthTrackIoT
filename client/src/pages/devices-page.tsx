import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Device } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, Wifi, WifiOff, Trash } from "lucide-react";
import DeviceForm from "@/components/dashboard/device-form";

export default function DevicesPage() {
  const { user } = useAuth();
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);

  const {
    data: devices,
    isLoading,
    error,
  } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <p>Error loading devices: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connected Devices</h1>
          <p className="text-muted-foreground">
            Manage your ThingSpeak-connected health monitoring devices
          </p>
        </div>
        <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add ThingSpeak Device</DialogTitle>
              <DialogDescription>
                Connect your health monitoring device using ThingSpeak integration details
              </DialogDescription>
            </DialogHeader>
            {user && (
              <DeviceForm
                userId={user.id}
                onSuccess={() => setIsAddDeviceOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {devices && devices.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4">
            <WifiOff className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No devices connected</h3>
          <p className="mb-6 max-w-sm text-muted-foreground">
            You haven't connected any health monitoring devices yet. Add a device
            to start monitoring your vital signs.
          </p>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDeviceOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Device
            </Button>
          </DialogTrigger>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {devices?.map((device) => (
            <Card key={device.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="line-clamp-1 text-lg">
                    {device.name}
                  </CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Connected
                  </Badge>
                </div>
                <CardDescription>
                  Channel ID: {device.channelId}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-muted-foreground">Read API Key</p>
                    <p className="font-mono text-xs">
                      {device.readApiKey.substring(0, 8)}
                      {"..."}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Write API Key</p>
                    <p className="font-mono text-xs">
                      {device.writeApiKey.substring(0, 8)}
                      {"..."}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-1">
                <Button variant="outline" size="sm" className="w-full">
                  <Trash className="mr-2 h-3.5 w-3.5" />
                  Remove Device
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}