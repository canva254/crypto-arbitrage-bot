import { pgTable, text, serial, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Exchange schema
export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  status: text("status").notNull().default("offline"),
  lastChecked: timestamp("last_checked").defaultNow(),
});

export const insertExchangeSchema = createInsertSchema(exchanges).pick({
  name: true,
  isActive: true,
  apiKey: true,
  apiSecret: true,
  status: true,
});

// Opportunity schema
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  assetPair: text("asset_pair").notNull(),
  buyExchange: text("buy_exchange").notNull(),
  sellExchange: text("sell_exchange").notNull(),
  buyPrice: numeric("buy_price", { precision: 20, scale: 8 }).notNull(),
  sellPrice: numeric("sell_price", { precision: 20, scale: 8 }).notNull(),
  profitPercentage: numeric("profit_percentage", { precision: 10, scale: 4 }).notNull(),
  volume: numeric("volume", { precision: 20, scale: 2 }).notNull(),
  estimatedProfit: numeric("estimated_profit", { precision: 20, scale: 2 }).notNull(),
  risk: text("risk").notNull(),
  strategy: text("strategy").notNull(),
  route: text("route").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertOpportunitySchema = createInsertSchema(opportunities).pick({
  assetPair: true,
  buyExchange: true,
  sellExchange: true,
  buyPrice: true,
  sellPrice: true,
  profitPercentage: true,
  volume: true,
  estimatedProfit: true,
  risk: true,
  strategy: true,
  route: true,
  isActive: true,
});

// Stats schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  totalOpportunities: integer("total_opportunities").notNull().default(0),
  avgProfit: numeric("avg_profit", { precision: 10, scale: 4 }).notNull().default("0"),
  maxProfit: numeric("max_profit", { precision: 10, scale: 4 }).notNull().default("0"),
  successRate: numeric("success_rate", { precision: 10, scale: 4 }).notNull().default("0"),
  period: text("period").notNull(), // '24h', '7d', '30d'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertStatsSchema = createInsertSchema(stats).pick({
  totalOpportunities: true,
  avgProfit: true,
  maxProfit: true,
  successRate: true,
  period: true,
});

// Types
export type Exchange = typeof exchanges.$inferSelect;
export type InsertExchange = z.infer<typeof insertExchangeSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Stats = typeof stats.$inferSelect;
export type InsertStats = z.infer<typeof insertStatsSchema>;

// Enums
export const ExchangeStatusEnum = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error',
} as const;

export const RiskLevelEnum = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const StrategyTypeEnum = {
  SIMPLE: 'simple',
  TRIANGULAR: 'triangular',
} as const;
