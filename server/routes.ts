import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  getLatestData, 
  getHistoricalData, 
  checkForAlerts 
} from "./thingspeak";
import { z } from "zod";
import { insertDeviceSchema, insertThresholdSchema, VITAL_RANGES } from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Devices routes
  app.get("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const devices = await storage.getUserDevices(req.user!.id);
      res.json(devices);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/devices", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDeviceSchema.parse(req.body);
      const device = await storage.createDevice(validatedData);
      res.status(201).json(device);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  app.get("/api/devices/:id", isAuthenticated, async (req, res) => {
    try {
      const device = await storage.getDevice(parseInt(req.params.id));
      
      if (!device || device.userId !== req.user!.id) {
        return res.status(404).json({ message: "Device not found" });
      }
      
      res.json(device);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // ThingSpeak data routes
  app.get("/api/vitals/latest", isAuthenticated, async (req, res) => {
    try {
      const devices = await storage.getUserDevices(req.user!.id);
      
      if (devices.length === 0) {
        return res.status(404).json({ message: "No devices found" });
      }
      
      // Get data from the first device
      const device = devices[0];
      const data = await getLatestData(device.channelId, device.readApiKey);
      
      // Check for alerts based on the latest data
      await checkForAlerts(req.user!.id, data);
      
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/vitals/history", isAuthenticated, async (req, res) => {
    try {
      const devices = await storage.getUserDevices(req.user!.id);
      
      if (devices.length === 0) {
        return res.status(404).json({ message: "No devices found" });
      }
      
      const device = devices[0];
      const days = req.query.days ? parseInt(req.query.days as string) : 10;
      const data = await getHistoricalData(device.channelId, device.readApiKey, days);
      
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Alerts routes
  app.get("/api/alerts", isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getUserAlerts(req.user!.id);
      res.json(alerts);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.patch("/api/alerts/:id/read", isAuthenticated, async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const alert = await storage.getAlert(alertId);
      
      if (!alert || alert.userId !== req.user!.id) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      const updatedAlert = await storage.markAlertAsRead(alertId);
      res.json(updatedAlert);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Patients routes (for caregivers)
  app.get("/api/patients", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'caregiver') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patients = await storage.getCaregiverPatients(req.user!.id);
      res.json(patients);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.get("/api/patients/:id/vitals/latest", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'caregiver') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patientId = parseInt(req.params.id);
      const patients = await storage.getCaregiverPatients(req.user!.id);
      
      // Check if patient belongs to this caregiver
      const isPatientOfCaregiver = patients.some(p => p.id === patientId);
      if (!isPatientOfCaregiver) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const devices = await storage.getUserDevices(patientId);
      
      if (devices.length === 0) {
        return res.status(404).json({ message: "No devices found for this patient" });
      }
      
      const device = devices[0];
      const data = await getLatestData(device.channelId, device.readApiKey);
      
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Threshold management routes
  app.get("/api/thresholds", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const threshold = await storage.getUserThreshold(userId);
      
      if (!threshold) {
        // Return default thresholds if no custom values are set
        return res.json({
          userId,
          heartRateMin: VITAL_RANGES.heartRate.min.toString(),
          heartRateMax: VITAL_RANGES.heartRate.max.toString(),
          oxygenMin: VITAL_RANGES.oxygen.min.toString(),
          temperatureMin: VITAL_RANGES.temperature.min.toString(),
          temperatureMax: VITAL_RANGES.temperature.max.toString()
        });
      }
      
      res.json(threshold);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  app.post("/api/thresholds", isAuthenticated, async (req, res) => {
    try {
      // Add userId to the threshold data
      const thresholdData = {
        ...req.body,
        userId: req.user!.id
      };
      
      const validatedData = insertThresholdSchema.parse(thresholdData);
      const threshold = await storage.createOrUpdateThreshold(validatedData);
      res.status(201).json(threshold);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  // Get thresholds for a specific patient (caregiver only)
  app.get("/api/patients/:id/thresholds", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'caregiver') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patientId = parseInt(req.params.id);
      const patients = await storage.getCaregiverPatients(req.user!.id);
      
      // Check if patient belongs to this caregiver
      const isPatientOfCaregiver = patients.some(p => p.id === patientId);
      if (!isPatientOfCaregiver) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const threshold = await storage.getUserThreshold(patientId);
      
      if (!threshold) {
        // Return default thresholds if no custom values are set
        return res.json({
          userId: patientId,
          heartRateMin: VITAL_RANGES.heartRate.min.toString(),
          heartRateMax: VITAL_RANGES.heartRate.max.toString(),
          oxygenMin: VITAL_RANGES.oxygen.min.toString(),
          temperatureMin: VITAL_RANGES.temperature.min.toString(),
          temperatureMax: VITAL_RANGES.temperature.max.toString()
        });
      }
      
      res.json(threshold);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  });

  // Update thresholds for a specific patient (caregiver only)
  app.post("/api/patients/:id/thresholds", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'caregiver') {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const patientId = parseInt(req.params.id);
      const patients = await storage.getCaregiverPatients(req.user!.id);
      
      // Check if patient belongs to this caregiver
      const isPatientOfCaregiver = patients.some(p => p.id === patientId);
      if (!isPatientOfCaregiver) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Add patientId to the threshold data
      const thresholdData = {
        ...req.body,
        userId: patientId
      };
      
      const validatedData = insertThresholdSchema.parse(thresholdData);
      const threshold = await storage.createOrUpdateThreshold(validatedData);
      res.status(201).json(threshold);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
