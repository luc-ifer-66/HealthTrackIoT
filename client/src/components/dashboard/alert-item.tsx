import { useMutation } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  CheckCircle 
} from "lucide-react";

interface AlertItemProps {
  alert: Alert;
}

export default function AlertItem({ alert }: AlertItemProps) {
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/alerts/${alert.id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
    },
  });

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
        `, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const getSeverityStyles = () => {
    switch (alert.severity) {
      case 'critical':
        return {
          border: 'border-critical',
          bg: 'bg-critical/5',
          icon: <AlertCircle className="text-critical text-xl" />,
        };
      case 'warning':
        return {
          border: 'border-warning',
          bg: 'bg-warning/5',
          icon: <AlertTriangle className="text-warning text-xl" />,
        };
      default:
        return {
          border: 'border-primary',
          bg: 'bg-primary/5',
          icon: <Info className="text-primary text-xl" />,
        };
    }
  };

  const styles = getSeverityStyles();
  
  const handleMarkAsRead = () => {
    if (!alert.isRead) {
      markAsReadMutation.mutate();
    }
  };

  return (
    <div 
      className={`border-l-4 ${styles.border} p-4 ${styles.bg} mb-1 ${!alert.isRead ? 'cursor-pointer' : ''}`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start">
        <div className="mr-3 mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-medium flex items-center">
              {alert.type === 'heart-rate' && 'Heart Rate Alert'}
              {alert.type === 'oxygen' && 'Oxygen Saturation Alert'}
              {alert.type === 'temperature' && 'Temperature Alert'}
              {alert.type === 'device' && 'Device Alert'}
              {alert.isRead && <CheckCircle className="ml-2 h-4 w-4 text-green-500" />}
            </h4>
            <span className="text-muted-foreground text-xs">
              {formatDate(alert.timestamp)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {alert.message}
          </p>
        </div>
      </div>
    </div>
  );
}
