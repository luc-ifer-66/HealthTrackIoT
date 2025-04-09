import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Line } from "recharts";
import { VITAL_RANGES } from "@shared/schema";
import { Chart } from "@/components/ui/chart";

interface VitalCardProps {
  type: 'heart-rate' | 'oxygen' | 'temperature';
  value?: number;
  isLoading?: boolean;
}

interface VitalInfo {
  title: string;
  unit: string;
  min: number;
  max: number;
  color: string;
  borderColor: string;
}

export default function VitalCard({ type, value, isLoading = false }: VitalCardProps) {
  const [trendData, setTrendData] = useState<{ value: number }[]>([]);
  
  // Config for each vital type
  const vitalInfoMap: Record<VitalCardProps['type'], VitalInfo> = {
    'heart-rate': {
      title: 'Heart Rate',
      unit: VITAL_RANGES.heartRate.unit,
      min: VITAL_RANGES.heartRate.min,
      max: VITAL_RANGES.heartRate.max,
      color: 'rgb(0, 102, 204)',
      borderColor: 'border-primary'
    },
    'oxygen': {
      title: 'Oxygen Saturation',
      unit: VITAL_RANGES.oxygen.unit,
      min: VITAL_RANGES.oxygen.min,
      max: VITAL_RANGES.oxygen.max,
      color: 'rgb(0, 163, 224)',
      borderColor: 'border-accent'
    },
    'temperature': {
      title: 'Temperature',
      unit: VITAL_RANGES.temperature.unit,
      min: VITAL_RANGES.temperature.min,
      max: VITAL_RANGES.temperature.max,
      color: 'rgb(255, 183, 77)',
      borderColor: 'border-warning'
    }
  };
  
  const vitalInfo = vitalInfoMap[type];
  
  // Determine status based on value
  const getStatus = () => {
    if (!value) return { label: 'Unknown', class: 'bg-gray-500/20 text-gray-400' };
    
    if (value < vitalInfo.min || value > vitalInfo.max) {
      return { 
        label: value < vitalInfo.min ? 'Low' : 'High', 
        class: 'bg-warning/20 text-warning' 
      };
    }
    
    return { label: 'Normal', class: 'bg-success/20 text-success' };
  };
  
  const status = getStatus();
  
  // Update trend data when value changes
  useEffect(() => {
    if (value !== undefined) {
      setTrendData(prev => {
        const newData = [...prev, { value }];
        if (newData.length > 12) {
          return newData.slice(1);
        }
        return newData;
      });
    }
  }, [value]);
  
  return (
    <Card className={`bg-neutral-dark p-5 border-l-4 ${vitalInfo.borderColor} shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{vitalInfo.title}</h3>
        <div className={`text-xs py-1 px-2 rounded-full ${status.class}`}>{status.label}</div>
      </div>
      
      {isLoading ? (
        <div className="h-16 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex items-end">
            <div className="text-4xl font-bold">{value !== undefined ? value : '--'}</div>
            <div className="text-lg text-muted-foreground ml-2 mb-1">{vitalInfo.unit}</div>
          </div>
          
          <div className="mt-3 flex items-center text-sm">
            <span className="text-muted-foreground mr-2">Range:</span>
            <span className="text-white">{vitalInfo.min}-{vitalInfo.max} {vitalInfo.unit}</span>
          </div>
          
          <div className="mt-4 h-16">
            {trendData.length > 0 ? (
              <Chart className="w-full h-full">
                <Line
                  data={trendData}
                  dataKey="value"
                  stroke={vitalInfo.color}
                  strokeWidth={2}
                  dot={false}
                  type="monotone"
                />
              </Chart>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
