import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Slider } from "@/components/ui/slider";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Schema for threshold form validation
const thresholdFormSchema = z.object({
  heartRateMin: z.string().min(1, "Required"),
  heartRateMax: z.string().min(1, "Required"),
  oxygenMin: z.string().min(1, "Required"),
  temperatureMin: z.string().min(1, "Required"),
  temperatureMax: z.string().min(1, "Required"),
});

type ThresholdFormValues = z.infer<typeof thresholdFormSchema>;

interface ThresholdFormProps {
  patientId?: number; // If provided, we're editing thresholds for a patient (as caregiver)
  onSuccess?: () => void;
}

export default function ThresholdForm({ patientId, onSuccess }: ThresholdFormProps) {
  const { toast } = useToast();
  const apiPath = patientId ? `/api/patients/${patientId}/thresholds` : '/api/thresholds';
  
  // Define the threshold data interface
  interface ThresholdData {
    userId: number;
    heartRateMin: string;
    heartRateMax: string;
    oxygenMin: string;
    temperatureMin: string;
    temperatureMax: string;
    id?: number;
    updatedAt?: Date;
  }
  
  // Fetch existing thresholds
  const { 
    data: thresholds, 
    isLoading,
    error 
  } = useQuery<ThresholdData>({
    queryKey: [apiPath],
    enabled: true,
  });

  const defaultValues: ThresholdFormValues = {
    heartRateMin: "",
    heartRateMax: "",
    oxygenMin: "",
    temperatureMin: "",
    temperatureMax: "",
  };
  
  const currentValues = thresholds ? {
    heartRateMin: thresholds.heartRateMin || "",
    heartRateMax: thresholds.heartRateMax || "",
    oxygenMin: thresholds.oxygenMin || "",
    temperatureMin: thresholds.temperatureMin || "",
    temperatureMax: thresholds.temperatureMax || "",
  } : defaultValues;
  
  const form = useForm<ThresholdFormValues>({
    resolver: zodResolver(thresholdFormSchema),
    defaultValues,
    values: currentValues,
  });

  const thresholdMutation = useMutation({
    mutationFn: async (values: ThresholdFormValues) => {
      const res = await apiRequest("POST", apiPath, values);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Thresholds updated",
        description: "Alert thresholds have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [apiPath] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating thresholds",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ThresholdFormValues) {
    thresholdMutation.mutate(values);
  }

  if (isLoading) {
    return <div className="py-4 text-center text-muted-foreground">Loading thresholds...</div>;
  }

  if (error) {
    return <div className="py-4 text-center text-destructive">Error loading thresholds</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="font-medium">Heart Rate Thresholds (BPM)</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="heartRateMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alerts below this value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heartRateMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alerts above this value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="font-medium">Oxygen Saturation Threshold (%)</h3>
            <FormField
              control={form.control}
              name="oxygenMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="95" {...field} />
                  </FormControl>
                  <FormDescription>
                    Alerts below this value
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 border p-4 rounded-lg">
            <h3 className="font-medium">Temperature Thresholds (°C)</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="temperatureMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="36.5" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alerts below this value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="temperatureMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="37.5" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Alerts above this value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={thresholdMutation.isPending}
        >
          {thresholdMutation.isPending ? "Updating..." : "Update Thresholds"}
        </Button>
      </form>
    </Form>
  );
}