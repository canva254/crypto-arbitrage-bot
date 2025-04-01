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
  exchangeType: text("exchange_type").notNull().default("cex"), // 'cex' or 'dex'
  network: text("network"),
  gasPrice: numeric("gas_price", { precision: 20, scale: 8 }),
  liquidity: numeric("liquidity", { precision: 20, scale: 2 }),
  tvl: numeric("tvl", { precision: 20, scale: 2 }),
});

export const insertExchangeSchema = createInsertSchema(exchanges).pick({
  name: true,
  isActive: true,
  apiKey: true,
  apiSecret: true,
  status: true,
  exchangeType: true,
  network: true,
  gasPrice: true,
  liquidity: true,
  tvl: true,
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
  
  // DEX-specific fields
  buyExchangeType: text("buy_exchange_type").default("cex"),
  sellExchangeType: text("sell_exchange_type").default("cex"),
  buyNetwork: text("buy_network"),
  sellNetwork: text("sell_network"),
  estimatedGasCost: numeric("estimated_gas_cost", { precision: 20, scale: 8 }),
  estimatedCompletionTime: numeric("estimated_completion_time", { precision: 10, scale: 2 }),
  crossChainBridge: text("cross_chain_bridge"),
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
  
  // DEX-specific fields
  buyExchangeType: true,
  sellExchangeType: true,
  buyNetwork: true,
  sellNetwork: true,
  estimatedGasCost: true,
  estimatedCompletionTime: true,
  crossChainBridge: true,
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
  
  // DEX-specific stats
  cexToDexOpportunities: integer("cex_to_dex_opportunities").default(0),
  dexToCexOpportunities: integer("dex_to_cex_opportunities").default(0),
  dexToDexOpportunities: integer("dex_to_dex_opportunities").default(0),
  crossNetworkOpportunities: integer("cross_network_opportunities").default(0),
  averageGasCost: numeric("average_gas_cost", { precision: 20, scale: 8 }).default("0"),
  averageCompletionTime: numeric("average_completion_time", { precision: 10, scale: 2 }).default("0"),
  
  // Strategy stats
  simpleArbitrageCount: integer("simple_arbitrage_count").default(0),
  triangularArbitrageCount: integer("triangular_arbitrage_count").default(0),
  crossDexArbitrageCount: integer("cross_dex_arbitrage_count").default(0),
  flashLoanArbitrageCount: integer("flash_loan_arbitrage_count").default(0),
});

export const insertStatsSchema = createInsertSchema(stats).pick({
  totalOpportunities: true,
  avgProfit: true,
  maxProfit: true,
  successRate: true,
  period: true,
  
  // DEX-specific stats
  cexToDexOpportunities: true,
  dexToCexOpportunities: true,
  dexToDexOpportunities: true,
  crossNetworkOpportunities: true,
  averageGasCost: true,
  averageCompletionTime: true,
  
  // Strategy stats
  simpleArbitrageCount: true,
  triangularArbitrageCount: true,
  crossDexArbitrageCount: true,
  flashLoanArbitrageCount: true,
});

// Types
export type Exchange = typeof exchanges.$inferSelect;
export type InsertExchange = z.infer<typeof insertExchangeSchema>;

export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;

export type Stats = typeof stats.$inferSelect;
export type InsertStats = z.infer<typeof insertStatsSchema>;

// Helper function to convert string to Date
export function toDate(dateStr: string): Date {
  return new Date(dateStr);
}

// Enums
export const ExchangeStatusEnum = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  RATE_LIMITED: 'rate_limited',
  ERROR: 'error',
  HIGH_GAS: 'high_gas',
  CONGESTED: 'congested',
} as const;

export const RiskLevelEnum = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const StrategyTypeEnum = {
  SIMPLE: 'simple',
  TRIANGULAR: 'triangular',
  CROSS_DEX: 'cross-dex',
  FLASH_LOAN: 'flash-loan',
} as const;

export const ExchangeTypeEnum = {
  CEX: 'cex',
  DEX: 'dex',
} as const;

export const NetworkEnum = {
  ETHEREUM: 'ethereum',
  BSC: 'binance',
  SOLANA: 'solana',
  POLYGON: 'polygon',
  AVALANCHE: 'avalanche',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  FANTOM: 'fantom',
  BASE: 'base',
  ZKSYNC: 'zksync',
} as const;

export const BridgeStatusEnum = {
  ACTIVE: 'active',
  CONGESTED: 'congested',
  OFFLINE: 'offline',
} as const;

// DEX-specific schema tables
export const liquidityPools = pgTable("liquidity_pools", {
  id: serial("id").primaryKey(),
  exchange: text("exchange").notNull(),
  network: text("network").notNull(),
  pair: text("pair").notNull(),
  liquidityUSD: numeric("liquidity_usd", { precision: 20, scale: 2 }).notNull(),
  token0Amount: numeric("token0_amount", { precision: 20, scale: 8 }).notNull(),
  token1Amount: numeric("token1_amount", { precision: 20, scale: 8 }).notNull(),
  token0Symbol: text("token0_symbol").notNull(),
  token1Symbol: text("token1_symbol").notNull(),
  apy: numeric("apy", { precision: 10, scale: 4 }),
  fee: numeric("fee", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const gasPrices = pgTable("gas_prices", {
  id: serial("id").primaryKey(),
  network: text("network").notNull(),
  fast: numeric("fast", { precision: 20, scale: 8 }).notNull(),
  average: numeric("average", { precision: 20, scale: 8 }).notNull(),
  slow: numeric("slow", { precision: 20, scale: 8 }).notNull(),
  unit: text("unit").notNull(), // 'gwei', 'wei', 'satoshi'
  timestamp: timestamp("timestamp").defaultNow(),
});

export const crossChainBridges = pgTable("cross_chain_bridges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sourceNetwork: text("source_network").notNull(),
  destinationNetwork: text("destination_network").notNull(),
  supportedTokens: text("supported_tokens").array().notNull(),
  fee: numeric("fee", { precision: 10, scale: 4 }).notNull(),
  estimatedTime: numeric("estimated_time", { precision: 10, scale: 2 }).notNull(), // in minutes
  minimumAmount: numeric("minimum_amount", { precision: 20, scale: 8 }).notNull(),
  maximumAmount: numeric("maximum_amount", { precision: 20, scale: 8 }),
  status: text("status").notNull().default("active"),
});

export const flashLoanProviders = pgTable("flash_loan_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  network: text("network").notNull(),
  fee: numeric("fee", { precision: 10, scale: 4 }).notNull(),
  maxLoanAmount: numeric("max_loan_amount", { precision: 20, scale: 2 }).notNull(),
  supportedTokens: text("supported_tokens").array().notNull(),
});

// Insert schemas for DEX-specific tables
export const insertLiquidityPoolSchema = createInsertSchema(liquidityPools).pick({
  exchange: true,
  network: true,
  pair: true,
  liquidityUSD: true,
  token0Amount: true,
  token1Amount: true,
  token0Symbol: true,
  token1Symbol: true,
  apy: true,
  fee: true,
});

export const insertGasPriceSchema = createInsertSchema(gasPrices).pick({
  network: true,
  fast: true,
  average: true,
  slow: true,
  unit: true,
});

export const insertCrossChainBridgeSchema = createInsertSchema(crossChainBridges).pick({
  name: true,
  sourceNetwork: true,
  destinationNetwork: true,
  supportedTokens: true,
  fee: true,
  estimatedTime: true,
  minimumAmount: true,
  maximumAmount: true,
  status: true,
});

export const insertFlashLoanProviderSchema = createInsertSchema(flashLoanProviders).pick({
  name: true,
  network: true,
  fee: true,
  maxLoanAmount: true,
  supportedTokens: true,
});

// Additional types for DEX-specific tables
export type LiquidityPool = typeof liquidityPools.$inferSelect;
export type InsertLiquidityPool = z.infer<typeof insertLiquidityPoolSchema>;

export type GasPrice = typeof gasPrices.$inferSelect;
export type InsertGasPrice = z.infer<typeof insertGasPriceSchema>;

export type CrossChainBridge = typeof crossChainBridges.$inferSelect;
export type InsertCrossChainBridge = z.infer<typeof insertCrossChainBridgeSchema>;

export type FlashLoanProvider = typeof flashLoanProviders.$inferSelect;
export type InsertFlashLoanProvider = z.infer<typeof insertFlashLoanProviderSchema>;

// Trade Simulation schema
export const tradeSimulations = pgTable("trade_simulations", {
  id: serial("id").primaryKey(),
  assetPair: text("asset_pair").notNull(),
  buyExchange: text("buy_exchange").notNull(),
  sellExchange: text("sell_exchange").notNull(),
  initialAmount: numeric("initial_amount", { precision: 20, scale: 8 }).notNull(),
  tradedAmount: numeric("traded_amount", { precision: 20, scale: 8 }).notNull(),
  exchangeFees: numeric("exchange_fees", { precision: 20, scale: 8 }).notNull(),
  gasFees: numeric("gas_fees", { precision: 20, scale: 8 }).notNull(),
  flashLoanFees: numeric("flash_loan_fees", { precision: 20, scale: 8 }),
  slippageImpact: numeric("slippage_impact", { precision: 10, scale: 2 }),
  profitLoss: numeric("profit_loss", { precision: 20, scale: 8 }).notNull(),
  profitPercentage: numeric("profit_percentage", { precision: 10, scale: 2 }).notNull(),
  timestamp: text("timestamp"), // Using text instead of timestamp for compatibility with in-memory implementation
  userId: text("user_id"),
  useFlashLoan: boolean("use_flash_loan").default(false),
  useMevProtection: boolean("use_mev_protection").default(false),
  maxSlippage: numeric("max_slippage", { precision: 5, scale: 2 }),
  gasPriority: text("gas_priority").default("medium"),
  status: text("status").default("simulated"),
  strategy: text("strategy").default("simple"),
});

export const insertTradeSimulationSchema = createInsertSchema(tradeSimulations).pick({
  assetPair: true,
  buyExchange: true,
  sellExchange: true,
  initialAmount: true,
  tradedAmount: true,
  exchangeFees: true,
  gasFees: true,
  flashLoanFees: true,
  slippageImpact: true,
  profitLoss: true,
  profitPercentage: true,
  timestamp: true,
  userId: true,
  useFlashLoan: true,
  useMevProtection: true,
  maxSlippage: true,
  gasPriority: true,
  status: true,
  strategy: true,
});

export type TradeSimulation = typeof tradeSimulations.$inferSelect;
export type InsertTradeSimulation = z.infer<typeof insertTradeSimulationSchema>;
