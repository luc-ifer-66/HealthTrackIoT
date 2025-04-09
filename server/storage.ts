import { 
  users, 
  User, 
  InsertUser, 
  devices, 
  Device, 
  InsertDevice,
  alerts,
  Alert,
  InsertAlert,
  thresholds,
  Threshold,
  InsertThreshold
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { queryClient } from "./db";
import createMemoryStore from "memorystore";
import pkg from 'pg';
const { Pool } = pkg;

// Create a separate pg pool for connect-pg-simple
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Device methods
  getDevice(id: number): Promise<Device | undefined>;
  getUserDevices(userId: number): Promise<Device[]>;
  createDevice(device: InsertDevice): Promise<Device>;
  
  // Alert methods
  getAlert(id: number): Promise<Alert | undefined>;
  getUserAlerts(userId: number): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertAsRead(id: number): Promise<Alert>;
  
  // Patient-caregiver methods
  getCaregiverPatients(caregiverId: number): Promise<User[]>;
  
  // Threshold methods
  getUserThreshold(userId: number): Promise<Threshold | undefined>;
  createOrUpdateThreshold(threshold: InsertThreshold): Promise<Threshold>;

  // Session store
  sessionStore: any; // Using any for SessionStore to avoid TypeScript errors
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private devices: Map<number, Device>;
  private alerts: Map<number, Alert>;
  private thresholds: Map<number, Threshold>;
  sessionStore: any; // Using any for the session store
  private currentUserId: number;
  private currentDeviceId: number;
  private currentAlertId: number;
  private currentThresholdId: number;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.alerts = new Map();
    this.thresholds = new Map();
    this.currentUserId = 1;
    this.currentDeviceId = 1;
    this.currentAlertId = 1;
    this.currentThresholdId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    // Create user with all required fields
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      email: insertUser.email,
      name: insertUser.name,
      role: insertUser.role || 'patient',
      patientId: insertUser.patientId || null,
      createdAt: now 
    };
    this.users.set(id, user);
    return user;
  }

  // Device methods
  async getDevice(id: number): Promise<Device | undefined> {
    return this.devices.get(id);
  }

  async getUserDevices(userId: number): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(
      (device) => device.userId === userId,
    );
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const id = this.currentDeviceId++;
    const now = new Date();
    const device: Device = {
      ...insertDevice,
      id,
      createdAt: now
    };
    this.devices.set(id, device);
    return device;
  }

  // Alert methods
  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
    const now = new Date();
    const alert: Alert = {
      ...insertAlert,
      id,
      timestamp: now,
      isRead: insertAlert.isRead || false
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async markAlertAsRead(id: number): Promise<Alert> {
    const alert = this.alerts.get(id);
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    const updatedAlert: Alert = {
      ...alert,
      isRead: true
    };
    
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  // Patient-caregiver methods
  async getCaregiverPatients(caregiverId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.patientId === caregiverId,
    );
  }

  // Threshold methods
  async getUserThreshold(userId: number): Promise<Threshold | undefined> {
    return Array.from(this.thresholds.values()).find(
      (threshold) => threshold.userId === userId
    );
  }

  async createOrUpdateThreshold(insertThreshold: InsertThreshold): Promise<Threshold> {
    // Check if a threshold for this user already exists
    const existingThreshold = await this.getUserThreshold(insertThreshold.userId);
    
    if (existingThreshold) {
      // Update existing threshold
      const updatedThreshold: Threshold = {
        ...existingThreshold,
        ...insertThreshold,
        updatedAt: new Date()
      };
      this.thresholds.set(existingThreshold.id, updatedThreshold);
      return updatedThreshold;
    } else {
      // Create new threshold
      const id = this.currentThresholdId++;
      const now = new Date();
      const threshold: Threshold = {
        ...insertThreshold,
        id,
        updatedAt: now
      };
      this.thresholds.set(id, threshold);
      return threshold;
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any for session store type

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: pgPool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user as User;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user as User;
  }

  // Device methods
  async getDevice(id: number): Promise<Device | undefined> {
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    return device as Device;
  }

  async getUserDevices(userId: number): Promise<Device[]> {
    const results = await db.select().from(devices).where(eq(devices.userId, userId));
    return results as Device[];
  }

  async createDevice(insertDevice: InsertDevice): Promise<Device> {
    const [device] = await db.insert(devices).values(insertDevice).returning();
    return device as Device;
  }

  // Alert methods
  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert as Alert;
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    const results = await db
      .select()
      .from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.timestamp));
    return results as Alert[];
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert as Alert;
  }

  async markAlertAsRead(id: number): Promise<Alert> {
    const [alert] = await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();
      
    if (!alert) {
      throw new Error("Alert not found");
    }
    
    return alert as Alert;
  }

  // Patient-caregiver methods
  async getCaregiverPatients(caregiverId: number): Promise<User[]> {
    const results = await db.select().from(users).where(eq(users.patientId, caregiverId));
    return results as User[];
  }

  // Threshold methods
  async getUserThreshold(userId: number): Promise<Threshold | undefined> {
    const [threshold] = await db.select().from(thresholds).where(eq(thresholds.userId, userId));
    return threshold as Threshold;
  }

  async createOrUpdateThreshold(insertThreshold: InsertThreshold): Promise<Threshold> {
    // Check if a threshold for this user already exists
    const existingThreshold = await this.getUserThreshold(insertThreshold.userId);
    
    if (existingThreshold) {
      // Update existing threshold
      const [updatedThreshold] = await db
        .update(thresholds)
        .set({ 
          ...insertThreshold,
          updatedAt: new Date() 
        })
        .where(eq(thresholds.id, existingThreshold.id))
        .returning();
        
      return updatedThreshold as Threshold;
    } else {
      // Create new threshold
      const [threshold] = await db
        .insert(thresholds)
        .values(insertThreshold)
        .returning();
        
      return threshold as Threshold;
    }
  }
}

// Export the DatabaseStorage for production use
export const storage = new DatabaseStorage();
