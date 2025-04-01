import { storage } from '../storage';
import { connectToExchanges, getTickersForPair, getExchangeStatus } from './exchanges';
import { InsertOpportunity, RiskLevelEnum, StrategyTypeEnum } from '@shared/schema';
import { COMMON_PAIRS, PAIR_RISK_LEVELS } from '@/lib/exchanges';

// Scanner interval (milliseconds)
const SCAN_INTERVAL = 30000; // 30 seconds
let scannerInterval: NodeJS.Timeout | null = null;
let isScanning = false;

// Start the arbitrage scanner
export function startArbitrageScanner() {
  if (scannerInterval) {
    clearInterval(scannerInterval);
  }
  
  console.log('Starting arbitrage scanner...');
  
  // Perform initial scan immediately
  performArbitrageScan();
  
  // Set up the recurring scan
  scannerInterval = setInterval(performArbitrageScan, SCAN_INTERVAL);
  
  return true;
}

// Stop the arbitrage scanner
export function stopArbitrageScanner() {
  if (scannerInterval) {
    clearInterval(scannerInterval);
    scannerInterval = null;
    console.log('Arbitrage scanner stopped.');
  }
  
  return true;
}

// Main scan function that detects arbitrage opportunities
async function performArbitrageScan() {
  if (isScanning) {
    console.log('Already scanning, skipping this cycle');
    return;
  }
  
  isScanning = true;
  console.log('Performing arbitrage scan...');
  
  try {
    const exchanges = await storage.getAllExchanges();
    const activeExchanges = exchanges.filter(e => e.isActive);
    
    if (activeExchanges.length < 2) {
      console.log('Not enough active exchanges to perform arbitrage scan');
      isScanning = false;
      return;
    }
    
    // Connect to exchanges
    const connectedExchanges = await connectToExchanges(activeExchanges);
    
    // Update exchange statuses in DB
    for (const exchange of activeExchanges) {
      const status = await getExchangeStatus(exchange.name);
      if (status !== exchange.status) {
        await storage.updateExchangeStatus(exchange.id, status);
      }
    }
    
    // Scan for simple arbitrage opportunities
    for (const pair of COMMON_PAIRS) {
      await detectSimpleArbitrage(pair, connectedExchanges);
    }
    
    // Scan for triangular arbitrage opportunities (this is more complex and just simulated here)
    await detectTriangularArbitrage();
    
    // Update stats
    await updateArbitrageStats();
    
    console.log('Arbitrage scan completed');
  } catch (error) {
    console.error('Error during arbitrage scan:', error);
  }
  
  isScanning = false;
}

// Detect simple arbitrage (buy on one exchange, sell on another)
async function detectSimpleArbitrage(pair: string, exchangeNames: string[]) {
  // Get tickers for the pair from all exchanges
  const tickers = await getTickersForPair(pair, exchangeNames);
  
  if (tickers.length < 2) {
    return; // Not enough exchanges have this pair
  }
  
  // Find best buy (lowest ask) and best sell (highest bid) prices
  const buyOpportunities = [...tickers].sort((a, b) => a.ask - b.ask);
  const sellOpportunities = [...tickers].sort((a, b) => b.bid - a.bid);
  
  const bestBuy = buyOpportunities[0];
  const bestSell = sellOpportunities[0];
  
  // Don't consider same exchange arbitrage (would need to account for order book depth)
  if (bestBuy.exchange === bestSell.exchange) {
    return;
  }
  
  // Calculate profit percentage
  const buyPrice = bestBuy.ask;
  const sellPrice = bestSell.bid;
  const profitPercentage = ((sellPrice - buyPrice) / buyPrice) * 100;
  
  // Only consider opportunities with positive profit
  if (profitPercentage <= 0) {
    return;
  }
  
  // Determine risk level based on pair and profit percentage
  let risk = PAIR_RISK_LEVELS[pair as keyof typeof PAIR_RISK_LEVELS] || RiskLevelEnum.MEDIUM;
  
  // Higher profit sometimes means higher risk
  if (profitPercentage > 3 && risk === RiskLevelEnum.LOW) {
    risk = RiskLevelEnum.MEDIUM;
  } else if (profitPercentage > 5) {
    risk = RiskLevelEnum.HIGH;
  }
  
  // Simulate a reasonable volume
  const volume = 5000 + Math.random() * 5000;
  const estimatedProfit = (volume * profitPercentage) / 100;
  
  // Create the opportunity object
  const opportunity: InsertOpportunity = {
    assetPair: pair,
    buyExchange: bestBuy.exchange,
    sellExchange: bestSell.exchange,
    buyPrice: buyPrice.toString(),
    sellPrice: sellPrice.toString(),
    profitPercentage: profitPercentage.toString(),
    volume: volume.toString(),
    estimatedProfit: estimatedProfit.toString(),
    risk,
    strategy: StrategyTypeEnum.SIMPLE,
    route: `${bestBuy.exchange} → ${bestSell.exchange}`,
    isActive: true
  };
  
  // Store the opportunity
  await storage.addOpportunity(opportunity);
}

// Simulate triangular arbitrage (simplified version)
async function detectTriangularArbitrage() {
  // For demo purposes, create some triangular arbitrage opportunities
  const triangularPairs = [
    { 
      pair: 'SOL/USDT', 
      steps: 'SOL/USDT → SOL/BTC → BTC/USDT',
      profit: 1.87,
      risk: RiskLevelEnum.MEDIUM 
    },
    { 
      pair: 'ADA/USDT', 
      steps: 'ADA/USDT → ADA/ETH → ETH/USDT',
      profit: 1.15,
      risk: RiskLevelEnum.HIGH 
    },
    { 
      pair: 'LINK/USDT', 
      steps: 'LINK/USDT → LINK/BTC → BTC/USDT',
      profit: 0.94,
      risk: RiskLevelEnum.MEDIUM 
    }
  ];
  
  for (const triangle of triangularPairs) {
    // Simulate pricing data
    const basePrice = 10 + Math.random() * 90; // Random base price
    const profitPercentage = triangle.profit + (Math.random() * 0.5 - 0.25); // Add some variance
    
    // Simulate volume
    const volume = 5000 + Math.random() * 5000;
    const estimatedProfit = (volume * profitPercentage) / 100;
    
    // Create the opportunity
    const opportunity: InsertOpportunity = {
      assetPair: triangle.pair,
      buyExchange: 'Binance', // Simplified, would be more complex in reality
      sellExchange: 'Binance', // Same exchange for triangular
      buyPrice: basePrice.toString(),
      sellPrice: (basePrice * (1 + profitPercentage / 100)).toString(),
      profitPercentage: profitPercentage.toString(),
      volume: volume.toString(),
      estimatedProfit: estimatedProfit.toString(),
      risk: triangle.risk,
      strategy: StrategyTypeEnum.TRIANGULAR,
      route: triangle.steps,
      isActive: true
    };
    
    // Store the opportunity
    await storage.addOpportunity(opportunity);
  }
}

// Update the arbitrage stats
async function updateArbitrageStats() {
  // Get all opportunities from the last 24 hours
  const opportunities = await storage.getOpportunities();
  
  // Calculate statistics
  const totalOpportunities = opportunities.length;
  
  if (totalOpportunities === 0) {
    return;
  }
  
  const profits = opportunities.map(o => parseFloat(o.profitPercentage.toString()));
  const avgProfit = profits.reduce((sum, profit) => sum + profit, 0) / profits.length;
  const maxProfit = Math.max(...profits);
  
  // Simulate success rate (in real app would track actual execution success)
  const successRate = 90 + Math.random() * 9; // 90-99%
  
  // Update stats for 24h period
  await storage.updateStats({
    totalOpportunities,
    avgProfit: avgProfit.toString(),
    maxProfit: maxProfit.toString(),
    successRate: successRate.toString(),
    period: '24h'
  });
}
