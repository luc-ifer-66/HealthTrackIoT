import { ThingSpeakResponse, VitalRanges, VITAL_RANGES, InsertAlert } from "@shared/schema";
import { storage } from "./storage";

const THINGSPEAK_API_BASE = "https://api.thingspeak.com";

/**
 * Get latest data from ThingSpeak channel
 */
export async function getLatestData(channelId: string, apiKey: string): Promise<ThingSpeakResponse> {
  const url = `${THINGSPEAK_API_BASE}/channels/${channelId}/feeds.json?api_key=${apiKey}&results=1`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`ThingSpeak API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get historical data from ThingSpeak for the past 10 days
 */
export async function getHistoricalData(channelId: string, apiKey: string, days = 10): Promise<ThingSpeakResponse> {
  // Calculate start date (10 days ago)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();
  
  const url = `${THINGSPEAK_API_BASE}/channels/${channelId}/feeds.json?api_key=${apiKey}&start=${startDateStr}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`ThingSpeak API error: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Check if vital signs are outside of normal ranges and create alerts
 * If custom thresholds exist for the user, those will be used instead of default ranges
 */
export async function checkForAlerts(
  userId: number, 
  data: ThingSpeakResponse, 
  defaultRanges: VitalRanges = VITAL_RANGES
): Promise<void> {
  if (!data.feeds || data.feeds.length === 0) return;
  
  // Try to get custom thresholds for this user
  const userThreshold = await storage.getUserThreshold(userId);
  
  // Create ranges object based on user's custom thresholds or defaults
  const ranges: VitalRanges = {
    heartRate: {
      min: userThreshold?.heartRateMin ? parseFloat(userThreshold.heartRateMin) : defaultRanges.heartRate.min,
      max: userThreshold?.heartRateMax ? parseFloat(userThreshold.heartRateMax) : defaultRanges.heartRate.max,
      unit: defaultRanges.heartRate.unit
    },
    oxygen: {
      min: userThreshold?.oxygenMin ? parseFloat(userThreshold.oxygenMin) : defaultRanges.oxygen.min,
      max: defaultRanges.oxygen.max,
      unit: defaultRanges.oxygen.unit
    },
    temperature: {
      min: userThreshold?.temperatureMin ? parseFloat(userThreshold.temperatureMin) : defaultRanges.temperature.min,
      max: userThreshold?.temperatureMax ? parseFloat(userThreshold.temperatureMax) : defaultRanges.temperature.max,
      unit: defaultRanges.temperature.unit
    }
  };
  
  const latestReading = data.feeds[0];
  
  // Check heart rate
  if (latestReading.field1 !== undefined) {
    const heartRate = latestReading.field1;
    if (heartRate < ranges.heartRate.min || heartRate > ranges.heartRate.max) {
      const severity = heartRate < ranges.heartRate.min - 10 || heartRate > ranges.heartRate.max + 10 
        ? 'critical' : 'warning';
      
      const alert: InsertAlert = {
        userId,
        type: 'heart-rate',
        message: `Heart rate is ${heartRate} BPM, outside normal range (${ranges.heartRate.min}-${ranges.heartRate.max} BPM)`,
        severity,
        isRead: false
      };
      
      await storage.createAlert(alert);
    }
  }
  
  // Check oxygen saturation
  if (latestReading.field2 !== undefined) {
    const oxygen = latestReading.field2;
    if (oxygen < ranges.oxygen.min) {
      const severity = oxygen < ranges.oxygen.min - 3 ? 'critical' : 'warning';
      
      const alert: InsertAlert = {
        userId,
        type: 'oxygen',
        message: `Oxygen saturation is ${oxygen}%, below normal range (≥${ranges.oxygen.min}%)`,
        severity,
        isRead: false
      };
      
      await storage.createAlert(alert);
    }
  }
  
  // Check temperature
  if (latestReading.field3 !== undefined) {
    const temperature = latestReading.field3;
    if (temperature < ranges.temperature.min || temperature > ranges.temperature.max) {
      const severity = temperature > ranges.temperature.max + 1 || temperature < ranges.temperature.min - 1
        ? 'critical' : 'warning';
      
      const alert: InsertAlert = {
        userId,
        type: 'temperature',
        message: `Temperature is ${temperature}°C, outside normal range (${ranges.temperature.min}-${ranges.temperature.max}°C)`,
        severity,
        isRead: false
      };
      
      await storage.createAlert(alert);
    }
  }
}
