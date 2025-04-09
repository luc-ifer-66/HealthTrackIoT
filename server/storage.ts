import { 
  users, 
  User, 
  InsertUser, 
  devices, 
  Device, 
  InsertDevice,
  alerts,
  Alert,
  InsertAlert
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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

  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private devices: Map<number, Device>;
  private alerts: Map<number, Alert>;
  sessionStore: session.SessionStore;
  private currentUserId: number;
  private currentDeviceId: number;
  private currentAlertId: number;

  constructor() {
    this.users = new Map();
    this.devices = new Map();
    this.alerts = new Map();
    this.currentUserId = 1;
    this.currentDeviceId = 1;
    this.currentAlertId = 1;
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
    const user: User = { 
      ...insertUser, 
      id, 
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
      timestamp: now
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
}

export const storage = new MemStorage();
