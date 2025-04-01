import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertExchangeSchema, insertOpportunitySchema, insertStatsSchema, ExchangeStatusEnum, RiskLevelEnum, StrategyTypeEnum } from "@shared/schema";
import { startArbitrageScanner, stopArbitrageScanner } from "./services/arbitrage";
import { setupExchanges } from "./services/exchanges";

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

  // Shutdown handler to stop the arbitrage scanner
  process.on('SIGINT', () => {
    stopArbitrageScanner();
    process.exit(0);
  });

  const httpServer = createServer(app);
  return httpServer;
}
