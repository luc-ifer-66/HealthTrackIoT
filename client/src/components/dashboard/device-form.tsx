import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeviceSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

// Extend device schema with validation rules
const deviceFormSchema = insertDeviceSchema.extend({
  name: z.string().min(2, "Device name must be at least 2 characters"),
  channelId: z.string().min(1, "ThingSpeak Channel ID is required"),
  readApiKey: z.string().min(1, "Read API key is required"),
  writeApiKey: z.string().min(1, "Write API key is required"),
});

type DeviceFormValues = z.infer<typeof deviceFormSchema>;

interface DeviceFormProps {
  userId: number;
  onSuccess?: () => void;
}

export default function DeviceForm({ userId, onSuccess }: DeviceFormProps) {
  const { toast } = useToast();
  
  const form = useForm<DeviceFormValues>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      userId,
      name: "",
      channelId: "",
      readApiKey: "",
      writeApiKey: "",
    },
  });

  const deviceMutation = useMutation({
    mutationFn: async (values: DeviceFormValues) => {
      const res = await apiRequest("POST", "/api/devices", values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Device added successfully",
        description: "Your device has been registered and is ready to use.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/devices'] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: DeviceFormValues) {
    deviceMutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Name</FormLabel>
                <FormControl>
                  <Input placeholder="My ESP32 Health Monitor" {...field} />
                </FormControl>
                <FormDescription>
                  A friendly name for your monitoring device
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="channelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ThingSpeak Channel ID</FormLabel>
                <FormControl>
                  <Input placeholder="123456" {...field} />
                </FormControl>
                <FormDescription>
                  The channel ID from your ThingSpeak account
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="readApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Read API Key</FormLabel>
                <FormControl>
                  <Input placeholder="XXXXXXXXXXXXXXXX" {...field} />
                </FormControl>
                <FormDescription>
                  The read API key for your ThingSpeak channel
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="writeApiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Write API Key</FormLabel>
                <FormControl>
                  <Input placeholder="XXXXXXXXXXXXXXXX" {...field} />
                </FormControl>
                <FormDescription>
                  The write API key for your ThingSpeak channel
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={deviceMutation.isPending}
        >
          {deviceMutation.isPending ? "Adding Device..." : "Add Device"}
        </Button>
      </form>
    </Form>
  );
}