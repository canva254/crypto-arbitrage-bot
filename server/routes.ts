import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertExchangeSchema, insertOpportunitySchema, insertStatsSchema,
  insertLiquidityPoolSchema, insertGasPriceSchema, insertCrossChainBridgeSchema, insertFlashLoanProviderSchema,
  ExchangeStatusEnum, RiskLevelEnum, StrategyTypeEnum, BridgeStatusEnum, ExchangeTypeEnum, NetworkEnum 
} from "@shared/schema";
import { startArbitrageScanner, stopArbitrageScanner } from "./services/arbitrage";
import { setupExchanges } from "./services/exchanges";
import { executeArbitrage } from "./services/execution";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize exchanges and start arbitrage scanner
  await setupExchanges();
  startArbitrageScanner();

  // API endpoint to get all exchanges
  app.get("/api/exchanges", async (req, res) => {
    try {
      const exchanges = await storage.getAllExchanges();
      res.json(exchanges);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ error: "Failed to fetch exchanges" });
    }
  });

  // API endpoint to add or update an exchange
  app.post("/api/exchanges", async (req, res) => {
    try {
      const validatedData = insertExchangeSchema.parse(req.body);
      const exchange = await storage.upsertExchange(validatedData);
      res.json(exchange);
    } catch (error) {
      console.error("Error adding exchange:", error);
      res.status(400).json({ error: "Invalid exchange data" });
    }
  });

  // API endpoint to update exchange status
  app.patch("/api/exchanges/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({
        status: z.enum([
          ExchangeStatusEnum.ONLINE, 
          ExchangeStatusEnum.OFFLINE, 
          ExchangeStatusEnum.RATE_LIMITED, 
          ExchangeStatusEnum.ERROR
        ])
      });
      const { status } = statusSchema.parse(req.body);
      
      const exchange = await storage.updateExchangeStatus(id, status);
      res.json(exchange);
    } catch (error) {
      console.error("Error updating exchange status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });
  
  // API endpoint to update exchange API keys
  app.patch("/api/exchanges/:id/keys", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const keysSchema = z.object({
        apiKey: z.string(),
        apiSecret: z.string(),
        additionalParams: z.record(z.string()).optional()
      });
      
      const keys = keysSchema.parse(req.body);
      
      // Get the exchange
      const exchange = await storage.getExchangeById(id);
      if (!exchange) {
        return res.status(404).json({ error: "Exchange not found" });
      }
      
      // Update the exchange with new API keys
      const updatedExchange = await storage.upsertExchange({
        ...exchange,
        apiKey: keys.apiKey,
        apiSecret: keys.apiSecret
      });
      
      // For security, don't return the actual API keys in the response
      const returnExchange = {
        ...updatedExchange,
        apiKey: updatedExchange.apiKey ? "[API KEY SET]" : null,
        apiSecret: updatedExchange.apiSecret ? "[API SECRET SET]" : null
      };
      
      res.json(returnExchange);
    } catch (error) {
      console.error("Error updating exchange API keys:", error);
      res.status(400).json({ error: "Invalid API key data" });
    }
  });

  // API endpoint to get arbitrage opportunities with filtering
  app.get("/api/opportunities", async (req, res) => {
    try {
      const minProfit = req.query.minProfit ? parseFloat(req.query.minProfit as string) : 0;
      const strategy = req.query.strategy as string || 'all';
      
      const opportunities = await storage.getOpportunities(minProfit, strategy);
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  // API endpoint to add a new arbitrage opportunity
  app.post("/api/opportunities", async (req, res) => {
    try {
      const validatedData = insertOpportunitySchema.parse(req.body);
      const opportunity = await storage.addOpportunity(validatedData);
      res.json(opportunity);
    } catch (error) {
      console.error("Error adding opportunity:", error);
      res.status(400).json({ error: "Invalid opportunity data" });
    }
  });

  // API endpoint to get stats for a specific period
  app.get("/api/stats/:period", async (req, res) => {
    try {
      const period = req.params.period;
      if (!['24h', '7d', '30d'].includes(period)) {
        return res.status(400).json({ error: "Invalid period. Use 24h, 7d, or 30d" });
      }
      
      const stats = await storage.getStatsByPeriod(period);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // API endpoint to update stats
  app.post("/api/stats", async (req, res) => {
    try {
      const validatedData = insertStatsSchema.parse(req.body);
      const stats = await storage.updateStats(validatedData);
      res.json(stats);
    } catch (error) {
      console.error("Error updating stats:", error);
      res.status(400).json({ error: "Invalid stats data" });
    }
  });

  // API endpoint to get historical profit data
  app.get("/api/history/profit", async (req, res) => {
    try {
      const pair = req.query.pair as string || 'all';
      const profitHistory = await storage.getProfitHistory(pair);
      res.json(profitHistory);
    } catch (error) {
      console.error("Error fetching profit history:", error);
      res.status(500).json({ error: "Failed to fetch profit history" });
    }
  });

  // API endpoint to get price comparison data
  app.get("/api/history/prices", async (req, res) => {
    try {
      const pair = req.query.pair as string;
      if (!pair) {
        return res.status(400).json({ error: "Pair parameter is required" });
      }
      
      const priceComparison = await storage.getPriceComparison(pair);
      res.json(priceComparison);
    } catch (error) {
      console.error("Error fetching price comparison:", error);
      res.status(500).json({ error: "Failed to fetch price comparison" });
    }
  });

  // DEX-specific API endpoints
  
  // API endpoint to get liquidity pools with optional filtering
  app.get("/api/dex/liquidity-pools", async (req, res) => {
    try {
      const exchange = req.query.exchange as string;
      const network = req.query.network as string;
      
      const pools = await storage.getLiquidityPools(exchange, network);
      res.json(pools);
    } catch (error) {
      console.error("Error fetching liquidity pools:", error);
      res.status(500).json({ error: "Failed to fetch liquidity pools" });
    }
  });

  // API endpoint to get a specific liquidity pool by pair
  app.get("/api/dex/liquidity-pools/:exchange/:network/:pair", async (req, res) => {
    try {
      const { exchange, network, pair } = req.params;
      const pool = await storage.getLiquidityPoolByPair(exchange, network, pair);
      
      if (!pool) {
        return res.status(404).json({ error: "Liquidity pool not found" });
      }
      
      res.json(pool);
    } catch (error) {
      console.error("Error fetching liquidity pool:", error);
      res.status(500).json({ error: "Failed to fetch liquidity pool" });
    }
  });

  // API endpoint to add a new liquidity pool
  app.post("/api/dex/liquidity-pools", async (req, res) => {
    try {
      const validatedData = insertLiquidityPoolSchema.parse(req.body);
      const pool = await storage.addLiquidityPool(validatedData);
      res.json(pool);
    } catch (error) {
      console.error("Error adding liquidity pool:", error);
      res.status(400).json({ error: "Invalid liquidity pool data" });
    }
  });

  // API endpoint to get latest gas prices for a network
  app.get("/api/dex/gas-prices/:network", async (req, res) => {
    try {
      const { network } = req.params;
      const gasPrice = await storage.getLatestGasPrices(network);
      
      if (!gasPrice) {
        return res.status(404).json({ error: "Gas price data not found for this network" });
      }
      
      res.json(gasPrice);
    } catch (error) {
      console.error("Error fetching gas prices:", error);
      res.status(500).json({ error: "Failed to fetch gas prices" });
    }
  });

  // API endpoint to add a new gas price entry
  app.post("/api/dex/gas-prices", async (req, res) => {
    try {
      const validatedData = insertGasPriceSchema.parse(req.body);
      const gasPrice = await storage.addGasPrice(validatedData);
      res.json(gasPrice);
    } catch (error) {
      console.error("Error adding gas price:", error);
      res.status(400).json({ error: "Invalid gas price data" });
    }
  });

  // API endpoint to get cross-chain bridges with optional filtering
  app.get("/api/dex/bridges", async (req, res) => {
    try {
      const sourceNetwork = req.query.sourceNetwork as string;
      const destinationNetwork = req.query.destinationNetwork as string;
      
      const bridges = await storage.getCrossChainBridges(sourceNetwork, destinationNetwork);
      res.json(bridges);
    } catch (error) {
      console.error("Error fetching cross-chain bridges:", error);
      res.status(500).json({ error: "Failed to fetch cross-chain bridges" });
    }
  });

  // API endpoint to add a new cross-chain bridge
  app.post("/api/dex/bridges", async (req, res) => {
    try {
      const validatedData = insertCrossChainBridgeSchema.parse(req.body);
      const bridge = await storage.addCrossChainBridge(validatedData);
      res.json(bridge);
    } catch (error) {
      console.error("Error adding cross-chain bridge:", error);
      res.status(400).json({ error: "Invalid cross-chain bridge data" });
    }
  });

  // API endpoint to update a bridge status
  app.patch("/api/dex/bridges/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const statusSchema = z.object({
        status: z.enum([
          BridgeStatusEnum.ACTIVE,
          BridgeStatusEnum.CONGESTED,
          BridgeStatusEnum.OFFLINE
        ])
      });
      const { status } = statusSchema.parse(req.body);
      
      const bridge = await storage.updateBridgeStatus(id, status);
      res.json(bridge);
    } catch (error) {
      console.error("Error updating bridge status:", error);
      res.status(400).json({ error: "Invalid status data" });
    }
  });

  // API endpoint to get flash loan providers with optional network filtering
  app.get("/api/dex/flash-loan-providers", async (req, res) => {
    try {
      const network = req.query.network as string;
      
      const providers = await storage.getFlashLoanProviders(network);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching flash loan providers:", error);
      res.status(500).json({ error: "Failed to fetch flash loan providers" });
    }
  });

  // API endpoint to add a new flash loan provider
  app.post("/api/dex/flash-loan-providers", async (req, res) => {
    try {
      const validatedData = insertFlashLoanProviderSchema.parse(req.body);
      const provider = await storage.addFlashLoanProvider(validatedData);
      res.json(provider);
    } catch (error) {
      console.error("Error adding flash loan provider:", error);
      res.status(400).json({ error: "Invalid flash loan provider data" });
    }
  });
  
  // API endpoint to execute an arbitrage opportunity
  app.post("/api/opportunities/:id/execute", async (req, res) => {
    try {
      const opportunityId = parseInt(req.params.id);
      
      // Validate that the opportunity exists
      const opportunity = await storage.getOpportunityById(opportunityId);
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      // Check if opportunity is still active
      if (!opportunity.isActive) {
        return res.status(400).json({ error: "Opportunity is no longer active" });
      }
      
      // Execute the arbitrage opportunity
      console.log(`Executing arbitrage opportunity #${opportunityId}...`);
      const result = await executeArbitrage(opportunityId);
      
      // Return the execution result
      res.json(result);
    } catch (error) {
      console.error("Error executing arbitrage opportunity:", error);
      res.status(500).json({ 
        error: "Failed to execute arbitrage opportunity",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Shutdown handler to stop the arbitrage scanner
  process.on('SIGINT', () => {
    stopArbitrageScanner();
    process.exit(0);
  });

  const httpServer = createServer(app);
  return httpServer;
}
