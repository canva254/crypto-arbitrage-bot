import { storage } from '../storage';
import { connectToExchanges, getTickersForPair, getExchangeStatus } from './exchanges';
import { 
  InsertOpportunity, 
  RiskLevelEnum, 
  StrategyTypeEnum, 
  ExchangeTypeEnum, 
  NetworkEnum 
} from '@shared/schema';
import { 
  COMMON_PAIRS, 
  PAIR_RISK_LEVELS, 
  EXCHANGE_FEES, 
  NETWORK_TRANSFER_TIMES, 
  NETWORK_FACTORS,
  RISK_FACTORS
} from '@/lib/exchanges';

// Scanner interval (milliseconds)
const SCAN_INTERVAL = 30000; // 30 seconds
let scannerInterval: NodeJS.Timeout | null = null;
let isScanning = false;

// Risk management configuration
const RISK_CONFIG = {
  MAX_POSITION_SIZE: 10000, // Maximum position size in USD
  MAX_DAILY_LOSS: 5000,     // Maximum allowable daily loss in USD
  CIRCUIT_BREAKER_THRESHOLD: 3, // Number of consecutive losses before halting
  SLIPPAGE_BUFFER: 0.5,     // Additional buffer for slippage in %
  MAX_GAS_PRICE: {
    [NetworkEnum.ETHEREUM]: 100, // Gwei
    [NetworkEnum.BSC]: 10,      // Gwei
    [NetworkEnum.POLYGON]: 300, // Gwei
    [NetworkEnum.ARBITRUM]: 1,  // Gwei
    [NetworkEnum.OPTIMISM]: 1,  // Gwei
  },
  MIN_LIQUIDITY_POOL_SIZE: 100000, // Minimum liquidity pool size for DEX trades in USD
};

// Tracking variables for risk management
let consecutiveLosses = 0;
let dailyProfitLoss = 0;
let dailyTradeCount = 0;
let lastResetTime = Date.now();

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
    // Check risk management circuit breakers
    if (checkCircuitBreakers()) {
      console.log('Circuit breakers triggered, skipping scan');
      isScanning = false;
      return;
    }
    
    // Reset daily counters if needed (once per day)
    const currentTime = Date.now();
    if (currentTime - lastResetTime > 24 * 60 * 60 * 1000) {
      resetDailyCounters();
    }
    
    const exchanges = await storage.getAllExchanges();
    const activeExchanges = exchanges.filter(e => e.isActive);
    
    if (activeExchanges.length < 2) {
      console.log('Not enough active exchanges to perform arbitrage scan');
      isScanning = false;
      return;
    }
    
    // Fetch latest gas prices for various networks
    await updateGasPrices();
    
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
    
    // Scan for triangular arbitrage opportunities
    await detectTriangularArbitrage();
    
    // Scan for cross-DEX arbitrage opportunities
    await detectCrossDexArbitrage();
    
    // Scan for flash loan arbitrage opportunities
    await detectFlashLoanArbitrage();
    
    // Scan for statistical arbitrage opportunities
    await detectStatisticalArbitrage();
    
    // Update stats
    await updateArbitrageStats();
    
    console.log('Arbitrage scan completed');
  } catch (error) {
    console.error('Error during arbitrage scan:', error);
  }
  
  isScanning = false;
}

// Check if risk management circuit breakers have been triggered
function checkCircuitBreakers(): boolean {
  // Check consecutive losses
  if (consecutiveLosses >= RISK_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
    console.log(`Circuit breaker triggered: ${consecutiveLosses} consecutive losses detected`);
    return true;
  }
  
  // Check daily loss limit
  if (dailyProfitLoss < -RISK_CONFIG.MAX_DAILY_LOSS) {
    console.log(`Circuit breaker triggered: Daily loss limit of $${RISK_CONFIG.MAX_DAILY_LOSS} exceeded`);
    return true;
  }
  
  return false;
}

// Reset daily tracking counters
function resetDailyCounters() {
  dailyProfitLoss = 0;
  dailyTradeCount = 0;
  lastResetTime = Date.now();
  console.log('Daily risk management counters reset');
}

// Update gas prices for various networks
async function updateGasPrices() {
  try {
    // In a real implementation, this would fetch from price oracles or RPC nodes
    // For now we'll simulate with random but realistic values
    
    for (const network of Object.values(NetworkEnum)) {
      const gasPrice = {
        network,
        fast: (10 + Math.random() * 100).toString(),
        average: (5 + Math.random() * 50).toString(),
        slow: (1 + Math.random() * 20).toString(),
        unit: network === NetworkEnum.ETHEREUM ? 'gwei' : 'gwei',
      };
      
      await storage.addGasPrice(gasPrice);
    }
  } catch (error) {
    console.error('Error updating gas prices:', error);
  }
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

// Detect cross-DEX arbitrage opportunities
async function detectCrossDexArbitrage() {
  try {
    // Get all DEX exchanges
    const exchanges = await storage.getAllExchanges();
    const dexExchanges = exchanges.filter(e => e.isActive && e.type === ExchangeTypeEnum.DEX);
    
    if (dexExchanges.length < 2) {
      console.log('Not enough active DEXes for cross-DEX arbitrage');
      return;
    }
    
    // Get liquidity pools for comparison
    const liquidityPools = await storage.getLiquidityPools();
    
    if (liquidityPools.length < 2) {
      console.log('Not enough liquidity pools for cross-DEX arbitrage');
      return;
    }
    
    // Group pools by pair
    const poolsByPair: Record<string, typeof liquidityPools> = {};
    
    for (const pool of liquidityPools) {
      if (!poolsByPair[pool.pair]) {
        poolsByPair[pool.pair] = [];
      }
      poolsByPair[pool.pair].push(pool);
    }
    
    // Find opportunities by comparing prices across DEXes
    for (const [pair, pools] of Object.entries(poolsByPair)) {
      if (pools.length < 2) continue;
      
      // Calculate implied prices (this is a simplified version)
      const pricesWithExchanges = pools.map(pool => {
        // Convert to a common price format (token0/token1)
        const impliedPrice = parseFloat(pool.token0Amount.toString()) / 
                             parseFloat(pool.token1Amount.toString());
        return {
          exchange: pool.exchange,
          network: pool.network,
          price: impliedPrice,
          liquidityUSD: parseFloat(pool.liquidityUSD.toString()),
          fee: parseFloat(pool.fee.toString())
        };
      });
      
      // Sort by price to find the best buy and sell opportunities
      const sortedPrices = [...pricesWithExchanges].sort((a, b) => a.price - b.price);
      
      // Find best buy (lowest price) and sell (highest price) opportunities
      for (let i = 0; i < sortedPrices.length - 1; i++) {
        const buyDex = sortedPrices[i];
        const sellDex = sortedPrices[sortedPrices.length - 1];
        
        // Skip if exchanges are the same
        if (buyDex.exchange === sellDex.exchange && buyDex.network === sellDex.network) {
          continue;
        }
        
        // Calculate profit percentage (accounting for fees)
        const buyFee = buyDex.fee;
        const sellFee = sellDex.fee;
        const totalFees = buyFee + sellFee;
        
        // Calculate price difference accounting for fees
        const priceDiff = sellDex.price - buyDex.price;
        const profitPercentage = (priceDiff / buyDex.price) * 100 - totalFees;
        
        // Only consider profitable opportunities
        if (profitPercentage <= 0) {
          continue;
        }
        
        // Check if cross-network
        const isCrossNetwork = buyDex.network !== sellDex.network;
        
        // Determine risk level
        let risk = RiskLevelEnum.MEDIUM;
        
        // Cross-network has higher risk
        if (isCrossNetwork) {
          risk = RiskLevelEnum.HIGH;
        }
        
        // Estimate gas costs for the transaction
        let estimatedGasCost = 0;
        let estimatedCompletionTime = 0;
        let crossChainBridge = '';
        
        if (isCrossNetwork) {
          // Get gas prices for both networks
          const buyNetworkGas = await storage.getLatestGasPrices(buyDex.network);
          const sellNetworkGas = await storage.getLatestGasPrices(sellDex.network);
          
          if (buyNetworkGas && sellNetworkGas) {
            // Simplified gas cost calculation
            estimatedGasCost = 
              parseFloat(buyNetworkGas.fast.toString()) + 
              parseFloat(sellNetworkGas.fast.toString());
          }
          
          // Get transfer time between networks
          const transferTime = NETWORK_TRANSFER_TIMES[buyDex.network as keyof typeof NETWORK_TRANSFER_TIMES]?.[sellDex.network] || 10;
          estimatedCompletionTime = transferTime;
          
          // Find a suitable bridge
          const bridges = await storage.getCrossChainBridges(buyDex.network, sellDex.network);
          if (bridges.length > 0) {
            crossChainBridge = bridges[0].name;
          }
        } else {
          // For same network operations, only account for gas in that network
          const networkGas = await storage.getLatestGasPrices(buyDex.network);
          if (networkGas) {
            estimatedGasCost = parseFloat(networkGas.fast.toString());
          }
          estimatedCompletionTime = 1; // 1 minute for same network
        }
        
        // Position sizing based on liquidity
        const maxPositionSize = Math.min(
          buyDex.liquidityUSD * 0.05, // Don't use more than 5% of liquidity
          sellDex.liquidityUSD * 0.05,
          RISK_CONFIG.MAX_POSITION_SIZE
        );
        
        // Create opportunity
        const opportunity: InsertOpportunity = {
          assetPair: pair,
          buyExchange: buyDex.exchange,
          sellExchange: sellDex.exchange,
          buyPrice: buyDex.price.toString(),
          sellPrice: sellDex.price.toString(),
          profitPercentage: profitPercentage.toString(),
          volume: maxPositionSize.toString(),
          estimatedProfit: ((maxPositionSize * profitPercentage) / 100).toString(),
          risk,
          strategy: StrategyTypeEnum.CROSS_DEX,
          route: `${buyDex.exchange} (${buyDex.network}) → ${isCrossNetwork ? crossChainBridge + ' → ' : ''}${sellDex.exchange} (${sellDex.network})`,
          isActive: true,
          
          // DEX-specific fields
          buyExchangeType: ExchangeTypeEnum.DEX,
          sellExchangeType: ExchangeTypeEnum.DEX,
          buyNetwork: buyDex.network,
          sellNetwork: sellDex.network,
          estimatedGasCost: estimatedGasCost.toString(),
          estimatedCompletionTime: estimatedCompletionTime.toString(),
          crossChainBridge: isCrossNetwork ? crossChainBridge : undefined
        };
        
        await storage.addOpportunity(opportunity);
      }
    }
    
    console.log('Cross-DEX arbitrage scan completed');
  } catch (error) {
    console.error('Error in cross-DEX arbitrage detection:', error);
  }
}

// Detect flash loan arbitrage opportunities
async function detectFlashLoanArbitrage() {
  try {
    // Get all flash loan providers
    const providers = await storage.getFlashLoanProviders();
    
    if (providers.length === 0) {
      console.log('No flash loan providers available');
      return;
    }
    
    // Get all DEX exchanges
    const exchanges = await storage.getAllExchanges();
    const dexExchanges = exchanges.filter(e => e.isActive && e.type === ExchangeTypeEnum.DEX);
    
    if (dexExchanges.length < 2) {
      return;
    }
    
    // For each provider, find potential arbitrage paths
    for (const provider of providers) {
      const providerNetwork = provider.network;
      
      // Get DEXes on the same network as the provider
      const networkDexes = dexExchanges.filter(e => e.network === providerNetwork);
      
      if (networkDexes.length < 2) {
        continue;
      }
      
      // Get supported tokens for this provider
      const supportedTokens = Array.isArray(provider.supportedTokens) 
        ? provider.supportedTokens 
        : JSON.parse(provider.supportedTokens as unknown as string);
      
      // Find paths for each supported token
      for (const token of supportedTokens) {
        // In a real system, we would find price discrepancies here
        // For now, we'll simulate some potential opportunities
        
        // Choose two random DEXes on the network for the path
        const shuffledDexes = [...networkDexes].sort(() => Math.random() - 0.5);
        const dex1 = shuffledDexes[0];
        const dex2 = shuffledDexes[1] || shuffledDexes[0]; // Fallback to same if only one
        
        if (!dex1 || !dex2) continue;
        
        // Calculate a simulated profit percentage
        const providerFee = parseFloat(provider.fee.toString());
        const baseProfit = 0.5 + Math.random() * 2; // 0.5-2.5%
        const profitPercentage = baseProfit - providerFee;
        
        // Skip if not profitable after fees
        if (profitPercentage <= 0) {
          continue;
        }
        
        // Calculate loan size and projected profit
        const maxLoanSize = parseFloat(provider.maxLoanAmount.toString());
        const loanSize = Math.min(
          maxLoanSize * 0.5, // Use half of max loan size
          1000000 // Cap at $1M
        );
        
        const estimatedProfit = loanSize * (profitPercentage / 100);
        
        // Create the opportunity
        const opportunity: InsertOpportunity = {
          assetPair: `${token}/USD`,
          buyExchange: dex1.name,
          sellExchange: dex2.name,
          buyPrice: (1000 + Math.random() * 500).toString(), // Simulate prices
          sellPrice: (1000 + Math.random() * 500).toString(),
          profitPercentage: profitPercentage.toString(),
          volume: loanSize.toString(),
          estimatedProfit: estimatedProfit.toString(),
          risk: RiskLevelEnum.HIGH, // Flash loans are high risk
          strategy: StrategyTypeEnum.FLASH_LOAN,
          route: `${provider.name} → ${dex1.name} → ${dex2.name} → Repay ${provider.name}`,
          isActive: true,
          
          // DEX-specific fields
          buyExchangeType: ExchangeTypeEnum.DEX,
          sellExchangeType: ExchangeTypeEnum.DEX,
          buyNetwork: providerNetwork,
          sellNetwork: providerNetwork,
          estimatedGasCost: (50 + Math.random() * 100).toString(), // Higher gas for flash loans
          estimatedCompletionTime: "1", // Flash loans complete in 1 block
        };
        
        await storage.addOpportunity(opportunity);
      }
    }
    
    console.log('Flash loan arbitrage scan completed');
  } catch (error) {
    console.error('Error in flash loan arbitrage detection:', error);
  }
}

// Detect statistical arbitrage opportunities
async function detectStatisticalArbitrage() {
  try {
    // For each supported pair, analyze price movements and volatility
    for (const pair of COMMON_PAIRS) {
      // In a real system, we would fetch historical price data here and apply 
      // statistical algorithms (mean reversion, z-score, etc.)
      
      // For demo purposes, we'll simulate some potential mean reversion opportunities
      const shouldCreateOpportunity = Math.random() > 0.7; // 30% chance
      
      if (!shouldCreateOpportunity) {
        continue;
      }
      
      // Choose two random exchanges
      const exchanges = await storage.getAllExchanges();
      const activeExchanges = exchanges.filter(e => e.isActive);
      
      if (activeExchanges.length < 2) {
        continue;
      }
      
      const shuffledExchanges = [...activeExchanges].sort(() => Math.random() - 0.5);
      const exchange1 = shuffledExchanges[0];
      const exchange2 = shuffledExchanges[1];
      
      if (!exchange1 || !exchange2) continue;
      
      // Simulate a z-score and profit potential
      const zScore = -2 + Math.random() * 4; // Range: -2 to 2
      const profitPotential = Math.abs(zScore) * 0.5; // Higher z-score = higher profit potential
      
      // Only consider opportunities with sufficient profit potential
      if (profitPotential < 0.3) {
        continue;
      }
      
      // Create the opportunity
      const basePrice = 100 + Math.random() * 1000;
      const priceDifference = basePrice * (profitPotential / 100);
      const targetPrice = zScore > 0 
        ? basePrice - priceDifference // Price expected to fall
        : basePrice + priceDifference; // Price expected to rise
      
      // Determine if this is a long or short position
      const isLong = zScore < 0; // Negative z-score means price is below mean (buy)
      
      // Calculate position size (smaller for statistical arb)
      const positionSize = 1000 + Math.random() * 9000;
      const expectedProfit = positionSize * (profitPotential / 100);
      
      // Determine risk based on z-score
      let risk = RiskLevelEnum.MEDIUM;
      if (Math.abs(zScore) < 1) {
        risk = RiskLevelEnum.HIGH; // Less extreme z-scores are higher risk
      }
      
      const opportunity: InsertOpportunity = {
        assetPair: pair,
        buyExchange: isLong ? exchange1.name : exchange2.name,
        sellExchange: isLong ? exchange2.name : exchange1.name,
        buyPrice: isLong ? basePrice.toString() : targetPrice.toString(),
        sellPrice: isLong ? targetPrice.toString() : basePrice.toString(),
        profitPercentage: profitPotential.toString(),
        volume: positionSize.toString(),
        estimatedProfit: expectedProfit.toString(),
        risk,
        strategy: 'statistical', // Note: May need to add this to enum
        route: `${isLong ? 'Long' : 'Short'} ${pair} | Z-Score: ${zScore.toFixed(2)}`,
        isActive: true,
        buyExchangeType: exchange1.type,
        sellExchangeType: exchange2.type,
      };
      
      await storage.addOpportunity(opportunity);
    }
    
    console.log('Statistical arbitrage scan completed');
  } catch (error) {
    console.error('Error in statistical arbitrage detection:', error);
  }
}

// Update the arbitrage stats
async function updateArbitrageStats() {
  // Get all opportunities
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
  
  // Count strategy types
  const simpleArbitrageCount = opportunities.filter(o => o.strategy === StrategyTypeEnum.SIMPLE).length;
  const triangularArbitrageCount = opportunities.filter(o => o.strategy === StrategyTypeEnum.TRIANGULAR).length;
  const crossDexArbitrageCount = opportunities.filter(o => o.strategy === StrategyTypeEnum.CROSS_DEX).length;
  const flashLoanArbitrageCount = opportunities.filter(o => o.strategy === StrategyTypeEnum.FLASH_LOAN).length;
  
  // Count DEX-specific metrics
  const cexToDexOpportunities = opportunities.filter(
    o => o.buyExchangeType === ExchangeTypeEnum.CEX && o.sellExchangeType === ExchangeTypeEnum.DEX
  ).length;
  
  const dexToCexOpportunities = opportunities.filter(
    o => o.buyExchangeType === ExchangeTypeEnum.DEX && o.sellExchangeType === ExchangeTypeEnum.CEX
  ).length;
  
  const dexToDexOpportunities = opportunities.filter(
    o => o.buyExchangeType === ExchangeTypeEnum.DEX && o.sellExchangeType === ExchangeTypeEnum.DEX
  ).length;
  
  const crossNetworkOpportunities = opportunities.filter(
    o => o.buyNetwork && o.sellNetwork && o.buyNetwork !== o.sellNetwork
  ).length;
  
  // Calculate average gas cost and completion time
  const opportunitiesWithGas = opportunities.filter(o => o.estimatedGasCost);
  const averageGasCost = opportunitiesWithGas.length > 0
    ? opportunitiesWithGas.reduce((sum, o) => sum + parseFloat(o.estimatedGasCost?.toString() || "0"), 0) / opportunitiesWithGas.length
    : 0;
  
  const opportunitiesWithTime = opportunities.filter(o => o.estimatedCompletionTime);
  const averageCompletionTime = opportunitiesWithTime.length > 0
    ? opportunitiesWithTime.reduce((sum, o) => sum + parseFloat(o.estimatedCompletionTime?.toString() || "0"), 0) / opportunitiesWithTime.length
    : 0;
  
  // Update stats for 24h period
  await storage.updateStats({
    totalOpportunities,
    avgProfit: avgProfit.toString(),
    maxProfit: maxProfit.toString(),
    successRate: successRate.toString(),
    period: '24h',
    
    // DEX-specific stats
    cexToDexOpportunities,
    dexToCexOpportunities,
    dexToDexOpportunities,
    crossNetworkOpportunities,
    averageGasCost: averageGasCost.toString(),
    averageCompletionTime: averageCompletionTime.toString(),
    
    // Strategy breakdown
    simpleArbitrageCount,
    triangularArbitrageCount,
    crossDexArbitrageCount,
    flashLoanArbitrageCount
  });
}
