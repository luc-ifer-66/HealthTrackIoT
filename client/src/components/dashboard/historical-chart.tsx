import { Card, CardContent } from "@/components/ui/card";
import { ThingSpeakResponse, VITAL_RANGES } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface HistoricalChartProps {
  type: 'heart-rate' | 'oxygen' | 'temperature';
  data?: ThingSpeakResponse;
  isLoading?: boolean;
}

export default function HistoricalChart({ type, data, isLoading = false }: HistoricalChartProps) {
  const [exportLoading, setExportLoading] = useState(false);
  
  // Config for each chart type
  const chartConfig = {
    'heart-rate': {
      field: 'field1',
      label: 'Heart Rate',
      unit: VITAL_RANGES.heartRate.unit,
      color: '#0066CC',
      min: Math.max(50, VITAL_RANGES.heartRate.min - 10),
      max: Math.min(150, VITAL_RANGES.heartRate.max + 30)
    },
    'oxygen': {
      field: 'field2',
      label: 'Oxygen Saturation',
      unit: VITAL_RANGES.oxygen.unit,
      color: '#00A3E0',
      min: Math.max(90, VITAL_RANGES.oxygen.min - 5),
      max: 100
    },
    'temperature': {
      field: 'field3',
      label: 'Temperature',
      unit: VITAL_RANGES.temperature.unit,
      color: '#FFB74D',
      min: Math.max(35, VITAL_RANGES.temperature.min - 1.5),
      max: Math.min(40, VITAL_RANGES.temperature.max + 2.5)
    }
  };
  
  // Process data for chart
  const chartData = useMemo(() => {
    if (!data?.feeds) return [];
    
    return data.feeds.map(feed => {
      const date = new Date(feed.created_at);
      return {
        timestamp: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        value: feed[chartConfig[type].field as keyof typeof feed],
        date
      };
    });
  }, [data, type]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    
    const values = chartData.filter(d => d.value !== undefined).map(d => Number(d.value));
    
    if (values.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, count: 0 };
    
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Calculate standard deviation
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    return {
      avg: parseFloat(avg.toFixed(1)),
      min: parseFloat(min.toFixed(1)),
      max: parseFloat(max.toFixed(1)),
      stdDev: parseFloat(stdDev.toFixed(1)),
      count: values.length
    };
  }, [chartData]);
  
  // Handle export data to CSV
  const handleExportData = () => {
    if (!data?.feeds || chartData.length === 0) return;
    
    setExportLoading(true);
    
    try {
      const headers = [`Date,${chartConfig[type].label} (${chartConfig[type].unit})`];
      
      const rows = chartData.map(item => {
        return `${item.date.toISOString()},${item.value}`;
      });
      
      const csvContent = [...headers, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${chartConfig[type].label.toLowerCase().replace(' ', '-')}-data.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <Card className="bg-neutral-dark shadow-lg">
      <CardContent className="p-5">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-72 flex items-center justify-center text-muted-foreground">
            No historical data available
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="rgba(255, 255, 255, 0.7)"
                />
                <YAxis 
                  domain={[chartConfig[type].min, chartConfig[type].max]}
                  stroke="rgba(255, 255, 255, 0.7)"
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(40, 48, 68, 0.9)',
                    borderColor: 'rgba(74, 144, 226, 0.3)',
                    color: '#FFFFFF'
                  }}
                  formatter={(value) => [`${value} ${chartConfig[type].unit}`, chartConfig[type].label]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={chartConfig[type].color} 
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                  name={chartConfig[type].label}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row justify-between mt-4 text-sm text-muted-foreground">
          <div>
            <div className="font-medium text-white">
              Average: <span className="text-primary">{stats.avg} {chartConfig[type].unit}</span>
            </div>
            <div>Min: {stats.min} {chartConfig[type].unit}</div>
          </div>
          
          <div>
            <div className="font-medium text-white">
              Max: <span className="text-warning">{stats.max} {chartConfig[type].unit}</span>
            </div>
            <div>Standard Deviation: ±{stats.stdDev}</div>
          </div>
          
          <div className="hidden md:block">
            <div className="font-medium text-white">Data Points: {stats.count}</div>
            <div>Readings every hour</div>
          </div>
          
          <div>
            <Button 
              variant="link" 
              className="text-primary p-0 h-auto hover:text-blue-400 font-medium"
              onClick={handleExportData}
              disabled={exportLoading || chartData.length === 0}
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Export Data
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
