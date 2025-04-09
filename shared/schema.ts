import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['patient', 'caregiver']);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('patient'),
  patientId: integer("patient_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ThingSpeak device schema
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  channelId: text("channel_id").notNull(),
  readApiKey: text("read_api_key").notNull(),
  writeApiKey: text("write_api_key").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Alert schema
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'temperature', 'heart-rate', 'oxygen', etc.
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  severity: text("severity").notNull(), // 'critical', 'warning', 'info'
});

// Define relations
export const usersRelations = relations(users, ({ one, many }) => ({
  devices: many(devices, { relationName: "user_devices" }),
  alerts: many(alerts, { relationName: "user_alerts" }),
  caregiver: one(users, {
    relationName: "patient_caregiver",
    fields: [users.patientId],
    references: [users.id],
  }),
  patients: many(users, {
    relationName: "patient_caregiver",
    fields: [users.id],
    references: [users.patientId],
  }),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, {
    relationName: "user_devices",
    fields: [devices.userId],
    references: [users.id],
  }),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  user: one(users, {
    relationName: "user_alerts",
    fields: [alerts.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceSchema = createInsertSchema(devices).omit({
  id: true,
  createdAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  timestamp: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// ThingSpeak data types
export interface ThingSpeakField {
  field1?: number; // Heart rate
  field2?: number; // Oxygen saturation
  field3?: number; // Temperature
  created_at: string;
}

export interface ThingSpeakResponse {
  channel: {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  feeds: ThingSpeakField[];
}

export interface VitalRanges {
  heartRate: { min: number; max: number; unit: string };
  oxygen: { min: number; max: number; unit: string };
  temperature: { min: number; max: number; unit: string };
}

// Default vital sign ranges
export const VITAL_RANGES: VitalRanges = {
  heartRate: { min: 60, max: 100, unit: "BPM" },
  oxygen: { min: 95, max: 100, unit: "%" },
  temperature: { min: 36.5, max: 37.5, unit: "°C" }
};
